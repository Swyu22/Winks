# ADR-0001 — 在 `links.category` 字段内编码 `__WINKS_META__` JSON

- **状态**：Accepted
- **日期**：2026-05-09（追溯记录，决策实际发生于 commit `4fe0d4a` `c934426` 期间）
- **作者**：（追溯整理：Claude）
- **关联**：[data-model.md](../10-spec/data-model.md)、[Supabase/schema.sql](../../Supabase/schema.sql)、[src/lib/linkMeta.js](../../src/lib/linkMeta.js)

## 1. 背景

需求演化轨迹：

1. **v0**：`links` 表只有 `category` 字段（单一分类）。
2. **多标签需求**（commit `c934426` `feat: support multi-tag links and hashtag filters`）：需要把多个 tag 关联到一条链接。
3. **看板（board）需求**（commit `86d0938` `feat: add board tabs with isolated links and copy button`）：需要把链接进一步隔离到 `网站` / `页面` 两个看板。
4. **修正**（commit `4fe0d4a` `fix: align supabase category constraint with metadata format`）：让 schema 接受 meta 编码格式。

最终前端需要表达的形状是：

```ts
{ classification: string; tags: string[]; board: '网站' | '页面' }
```

## 2. 备选方案

### 方案 A：在 `category` 内嵌 `__WINKS_META__{json}`（现采用）

**做法**：保留单字段，写入时加前缀 + JSON。读取时 `decodeLinkMeta` 解析；旧数据通过 `hydrateLink` 兼容。

**优点**：
- **零迁移**：现有 schema、RLS、索引、grant 全部沿用
- **零依赖**：不需要新增列、外键表、Supabase functions
- **GitHub Pages 友好**：前端是部署主体，schema 操作越少越好
- **Legacy 数据兼容**：`hydrateLink` 透明处理 `"工具"` `"工具,设计"` 这类历史值

**缺点**：
- 字段双重身份（**db 视角**: 含 meta 的 text；**前端视角**: 分类名）——命名陷阱
- 无法用 SQL 直接按 board / tag 过滤，必须前端 hydrate 后筛选
- text length cap = 2000，理论上限 tags 数量受限（实际远不达）
- 数据可读性差（DB 看一眼是乱码）

### 方案 B：拆三列 / 三表

**做法**：在 `links` 表新增 `tags text[]`、`board text`、`classification text`；或建 `link_tags` join 表。

**优点**：
- DB 语义清晰
- 可建索引、可 SQL 直接 filter
- 标签可独立管理（多语言、别名等）

**缺点**：
- **schema 迁移成本**：新增列、回填、调整 RLS，且当前部署是公开协作站，无 staging
- **跨设备/跨模型协作摩擦增加**：本仓库已是 worktree-driven 工作流，schema 改动比文档与代码改动昂贵
- **过度设计**：当前 boards 仅 2 个、tags 集合个位数

### 方案 C：另建 `link_meta` 表（一对一外键）

**优点**：兼顾结构化与最小入侵。
**缺点**：仍要迁移；多一次 join；前端复杂度提升。

## 3. 选择：方案 A

**理由摘要**：
- 项目当前的瓶颈是**前端复杂度**（App.jsx 1478 行）而非数据查询性能；
- DB 是部署外部依赖（Supabase 项目可能由非作者管理），减少 schema 变更降低协作风险；
- `hydrateLink` 已经把数据库杂乱状态收敛到前端确定形状，对调用方透明；
- 一旦未来需要 SQL 级筛选（例如服务端搜索），可以增量加结构化列，**不影响**已有 meta 字段的兼容路径。

## 4. 影响

### 必须遵守

1. 所有写入 `category` 必经 `encodeLinkMeta(...)`。
2. 所有读出 `category` 必经 `hydrateLink(...)`。
3. 任何对 meta JSON shape 的扩展，必须保持「旧客户端可读」（新增字段，禁删字段）。
4. 数据库的 `links_category_check` 只校验长度（`<= 2000`），**不**校验内容格式——内容契约由前端守卫。

### 演化预案

| 事件 | 处理 |
|---|---|
| 新增 meta 字段 | hydrate 增加分支默认值；旧客户端忽略 |
| 改语义 / 改前缀 | 视为破坏性变更，需新 ADR + 数据迁移脚本 |
| 引入 SQL 端筛选需求 | 增量加结构化列，与 meta 双写一段时间，再切换 |

## 5. 备注

- `LINK_META_PREFIX = "__WINKS_META__"`（[src/lib/constants.js](../../src/lib/constants.js)）选择 `__` 包裹，避免与 URL / 普通分类名碰撞。
- schema 中 `category` 默认值已含一个完整 meta JSON（[Supabase/schema.sql:13](../../Supabase/schema.sql:13)），意味着即便有人绕过前端直接 `INSERT title, url`，也会得到合法的 meta payload。
