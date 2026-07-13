# ADR-0007 — 一句话简介使用独立 `description` 列

- **状态**：Accepted
- **日期**：2026-07-13
- **作者**：Codex
- **关联**：[adr-0001](adr-0001-meta-encoding-in-category.md)、[data-model.md](../10-spec/data-model.md)、[supabase/schema.sql](../../supabase/schema.sql)、[src/lib/linkMeta.js](../../src/lib/linkMeta.js)、[src/lib/linkActions.js](../../src/lib/linkActions.js)

## 1. 背景

链接卡片需要在标题与标签之间展示一句最多 15 个字符的功能简介。简介由维护者在新增/编辑时手工填写，可以为空；本轮同时为现有 36 条生产记录回填。

`links.category` 已通过 ADR-0001 承载 `{classification, tags, board}` 三元组，因此需要决定简介继续扩展该 JSON，还是成为顶层列。

## 2. 备选方案

### 方案 A：新增 `description text` 可空列（现采用）

- 数据库可以直接约束 trim 状态和 15 字长度。
- `select('*')` 自动带出，读路径由 `hydrateLink` 统一把 `null` 转为 `''`。
- 保存路径可把空字符串转换为 `null`，语义明确。
- 简介不会与分类/标签编辑互相覆盖。

### 方案 B：写入 `__WINKS_META__` JSON

- 不需要 schema 迁移。
- 但简介是独立展示字段，不属于 taxonomy 三元组；所有编解码、legacy 兼容和局部分类更新都要理解新字段。
- 任何重建 category 的旧客户端都可能无意丢失简介。
- 数据库难以直接校验简介长度和空白。

## 3. 选择：方案 A

简介具有独立的展示、校验和编辑语义，使用可空顶层列能保持 `category` 合同专注于 taxonomy，并把兼容成本限制在读写归一化边界。

数据库合同：

```sql
description text null check (
  description is null
  or (
    description = btrim(description)
    and char_length(description) between 1 and 15
  )
)
```

## 4. 必须遵守

1. 简介禁止写入 `category` meta。
2. 所有数据库读结果仍须经过 `hydrateLink`；前端 `description` 恒为字符串。
3. 所有新增/编辑载荷须经过 `normalizeSaveLinkData`；空字符串写为数据库 `null`。
4. 新增简介为选填，编辑时允许清空。
5. 卡片为空时不展示占位文案，但必须保留一行高度，维持同行排版。
6. `LINKS_CACHE_KEY` 在数据形状变化时升级；本轮由 v1 升为 v2。

## 5. 发布与回填

- 迁移文件：`supabase/migrations/20260713102800_add_link_descriptions.sql`。
- 回填通过 36 个稳定 UUID 定位，避免标题或 URL 变化造成误更新。
- 数据库迁移必须先于生产前端部署，并在迁移后核对列、约束、总数、空值和最大长度。
