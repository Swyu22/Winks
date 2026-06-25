# ADR-0004 — 点击计数用独立 `clicks` 列，不塞进 `__WINKS_META__`

- **状态**：Accepted
- **日期**：2026-06-25
- **作者**：Claude（Opus 4.8）
- **关联**：[adr-0001](adr-0001-meta-encoding-in-category.md)、[data-model.md](../10-spec/data-model.md)、[Supabase/schema.sql](../../Supabase/schema.sql)、[src/lib/linkMeta.js](../../src/lib/linkMeta.js)、[src/hooks/useLinks.js](../../src/hooks/useLinks.js)

## 1. 背景

需求：为每条链接加点击计数器，点击多的链接排序上升（热门优先）。计数需跨用户/跨设备共享，因此必须持久化在数据库，且要可排序。

ADR-0001 已确立把 `{classification, tags, board}` 编码进 `links.category`（`__WINKS_META__` 前缀 JSON）。一个自然的疑问是：点击数是否也塞进这个 meta 三元组（方案 B），以延续「零 schema 迁移」的传统？

## 2. 备选方案

### 方案 A：新增独立列 `clicks integer not null default 0`（现采用）

- 写：`update links set clicks = ... where id = ?`，与 `category` 写路径完全解耦。
- 读：`hydrateLink` 因为 `{...link}` 透传，新列**零改动**即流到前端；本 ADR 仅显式补 `clicks: Number(link.clicks) || 0` 兜底。
- 排序：未来可走 SQL `order by clicks desc`（已建 `links_clicks_idx`）。

### 方案 B：塞进 `__WINKS_META__` JSON 三元组

- 零 schema 迁移、部署即生效。
- 但：`normalizeSaveLinkData` 的 `dbPayload` 只发 `{title, url, category}`，每次编辑链接都会用 `encodeLinkMeta` **整体重建** category。要不丢计数，必须让所有写路径读-合并当前计数，把一个一列计数器变成横切 `encodeLinkMeta` / `normalizeSaveLinkData` / `hydrateLink` / demo 种子的关注点。
- 并发更差：一次点击自增要重写整个 category 字符串，可能覆盖并发的分类/标签编辑（反之亦然）。
- 无法 SQL 排序/聚合。

## 3. 选择：方案 A

**理由**：点击数是**易变、数值、与分类/标签/看板语义正交**的事件计数，本就不属于 ADR-0001 刻意打包进 category 的稳定编辑期属性。独立列：

- 让普通编辑（重建 category）永不误伤计数，计数自增也永不误伤并发的 meta 编辑；
- `hydrateLink` 的行透传使前端改动最小；
- 存量行无需回填（列默认 0 自动生效）；
- 解锁未来服务端 `order by clicks` / top-N。

迁移成本仅为**一条幂等 `ALTER TABLE ADD COLUMN IF NOT EXISTS`**（+ 一个索引），远低于方案 B 强加的前端横切改动。这并非推翻 ADR-0001——meta 编码仍是分类/标签/看板的载体；方案 B 只适合「稳定的编辑期属性」，不适合事件计数器。

## 4. 影响

### 必须遵守

1. `clicks` 是 `links` 表的**顶层列**，**禁止**写进 `category` meta JSON。
2. 任何读路径仍经 `hydrateLink`，它保证 `clicks` 恒为数字（缺省 0）。
3. 自增走独立写路径（`useLinks` 的 `persistClick`），**不**经 `encodeLinkMeta`，**不**触发 PIN 流程（点击=公开只读动作）。

### 并发与威胁模型

- 自增当前是「读本地值 → +1 → update」，开放 RLS 下并发点击可能丢更新。本项目流量低，计数本就可被任意访客伪造（与 ADR-0002 弱保护一致），**接受**该误差。
- 如未来需要精确计数，升级为 Postgres 原子 RPC `update ... set clicks = clicks + 1`（避免回传当前值），不影响本 ADR 的列设计。

### 降级（迁移未应用时）

- 若线上库尚未执行 `ALTER TABLE`：`select('*')` 不含 clicks → hydrate 兜底为 0 → 排序退化为按 `created_at`；自增 `update({clicks})` 报错被 `persistClick` 吞掉（仅 `console.warn`），打开链接不受影响。即「静默失效、绝不报错」，执行迁移后自动生效。

## 5. 备注

- 迁移 SQL（在 Supabase SQL Editor 执行一次，幂等）：

  ```sql
  alter table public.links
    add column if not exists clicks integer not null default 0;
  create index if not exists links_clicks_idx on public.links (clicks desc);
  ```
