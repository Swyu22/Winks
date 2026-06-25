# Data Model Spec — `links` 表与 `__WINKS_META__` 编码

> 这是**前后端唯一合同**。任何改动都要先改本文件、再改代码。
> 配套决策：[ADR-0001 meta-encoding-in-category](../30-decisions/adr-0001-meta-encoding-in-category.md)

## 1. 表结构（Supabase）

```sql
public.links (
  id          uuid          primary key default gen_random_uuid(),
  created_at  timestamptz   not null    default now(),
  title       text          not null    check (char_length(title) <= 200),
  url         text          not null    check (url ~* '^https?://'),
  category    text          not null    default '__WINKS_META__{...}'
                                        check (char_length(category) <= 2000),
  created_by  uuid          references auth.users(id) on delete set null
                                        default auth.uid(),
  clicks      integer       not null    default 0   -- 点击计数（见 ADR-0004）
)
```

**索引**：`(created_at desc)`、`(created_by)`、`(clicks desc)`。

> `clicks` 是**顶层列**，承载点击计数（热门排序）。它**不**进 `category` meta，理由见
> [ADR-0004](../30-decisions/adr-0004-clicks-as-dedicated-column.md)。线上库需执行一次幂等迁移
> （`alter table ... add column if not exists clicks ...`）；未执行时前端静默降级（计数恒 0、按
> `created_at` 排序，自增写入失败被吞，打开链接不受影响）。

**RLS**：开放给 `anon` / `authenticated` 全部 CRUD（详见 ADR-0002）。

## 2. `category` 字段的双重身份 ⚠

`links.category` 是**单一 text 字段**，但承载两种含义：

### 2.1 Meta 模式（当前唯一写入格式）

```
__WINKS_META__{"classification":"<string>","tags":["<string>",...],"board":"<网站|页面>"}
```

- 前缀常量：`LINK_META_PREFIX = "__WINKS_META__"`（[src/lib/constants.js](../../src/lib/constants.js)）
- 后缀是 **严格 JSON**（无尾逗号、无注释）
- 所有 `insert` / `update` 都通过 `encodeLinkMeta()` 生成（[src/lib/linkMeta.js](../../src/lib/linkMeta.js)）

### 2.2 Legacy 模式（仅读，向后兼容）

历史数据可能形如：
- `"开发"`（纯分类名）
- `"开发,工具"` / `"开发，工具"`（中英文逗号分隔的标签列表）

`hydrateLink()`（[src/lib/linkMeta.js](../../src/lib/linkMeta.js)）负责把 Legacy 数据归一为前端使用的 `{board, category, tags}`。**不写回旧格式**——任何 update 都会自动升级为 Meta 模式。

## 3. 前端形状（hydrate 之后）

```ts
type Link = {
  id: string | number;
  title: string;
  url: string;          // 必含 http:// 或 https://
  category: string;     // 分类名（"未分类" 或自定义），不再含 meta 前缀
  tags: string[];       // 已规范化、去重、非空
  board: '网站' | '页面';
  clicks: number;       // 点击计数，hydrate 后恒为数字（缺省 0）
}
```

> ⚠ 「`category` 在前端 = 分类名」、「`category` 在数据库 = 含 meta 的字符串」——这是命名陷阱，重构时务必同步消歧。

## 4. 默认值与硬编码集合

| 常量 | 值 | 位置 |
|---|---|---|
| `DEFAULT_TAGS` | `['设计', '开发', '工具', '阅读', '灵感']` | [src/lib/constants.js](../../src/lib/constants.js) |
| `DEFAULT_CLASSIFICATIONS` | `['未分类']` | [src/lib/constants.js](../../src/lib/constants.js) |
| `DEFAULT_BOARDS` | `['网站', '页面']` | [src/lib/constants.js](../../src/lib/constants.js) |
| `LINK_META_PREFIX` | `'__WINKS_META__'` | [src/lib/constants.js](../../src/lib/constants.js) |

**重要**：`DEFAULT_BOARDS` 是**封闭集合**。`isKnownBoard` 校验任何外部值；不在集合内的 board 会被静默归一为 `DEFAULT_BOARDS[0]`（即 `'网站'`）。

## 5. 编码 / 解码契约

### 5.1 `encodeLinkMeta(classification, tags, board)`

- 入参允许带 `#` 前缀的 tag、空白、未规范化的字符串
- 内部经 `normalizeName` / `normalizeTag` / `uniqueTags`
- board 不在 `DEFAULT_BOARDS` 时回落到默认
- 输出**确定为**：`__WINKS_META__` + JSON 字符串

### 5.2 `decodeLinkMeta(rawValue)`

- 非 string 或不以 `__WINKS_META__` 开头 → 返回 `null`
- JSON 解析失败 → 返回 `null`
- 不做语义校验（边界值由 `hydrateLink` 兜底）

### 5.3 `hydrateLink(link)`

完整规则（按优先级）：

1. 尝试 `decodeLinkMeta(link.category)`
2. **tags**：`metadata.tags` 优先；否则 fallback 到 `link.tags ?? link.category` 的 legacy 解析；空集合补 `DEFAULT_TAGS[0]`。
3. **classification**：`metadata.classification` 优先；否则若 `category` 是单值（不含中英文逗号）则当作分类名；否则用 `DEFAULT_CLASSIFICATIONS[0]`。
4. **board**：`metadata.board` ∩ `DEFAULT_BOARDS`；否则用 `DEFAULT_BOARDS[0]`。
5. **clicks**：`Number(link.clicks) || 0`，保证前端恒拿到非负数字（列缺失时退化为 0）。

**调用点**（必须保证经过 hydrate）：
- 初始 `fetchLinks` 的 `data.map`
- `insert(...).select()` 返回值
- `update(...).select()` 返回值
- demo 模式的种子数据

## 6. 校验规则

| 字段 | 规则 |
|---|---|
| `title` | 必填、`length <= 200` |
| `url` | 必填、必须以 `http://` 或 `https://` 起始（前端会自动补 `https://`） |
| `category` | 必填、`length <= 2000` |
| `tags` | 至少 1 个非空字符串；元素去重；前端展示加 `#` 前缀但**存储不含** |
| `board` | 必须 ∈ `DEFAULT_BOARDS` |
| `clicks` | 非负整数；默认 0；自增走独立写路径（不经 `encodeLinkMeta`、不触发 PIN） |

## 7. 演化策略

| 类型变更 | 是否破坏兼容 | 处理 |
|---|---|---|
| 在 meta JSON 新增字段 | 兼容（旧客户端忽略） | 默认值兜底，hydrate 增加分支 |
| 修改 meta 字段语义 | **破坏** | 需要数据迁移 + 新 ADR |
| 新增 board | 破坏（旧客户端会归一为默认） | 同步改 `DEFAULT_BOARDS`，且评估存量 |
| 改前缀 `__WINKS_META__` | **强破坏** | 不允许，除非全量 rewrite |

## 8. 反例（不要这么写）

```js
// ❌ 直接给 category 赋字符串：legacy 路径，会被升级
client.from('links').update({ category: '工具' });

// ❌ 不经 encodeLinkMeta 拼字符串：易出 JSON 错误
client.from('links').insert({ category: `__WINKS_META__{...}` });

// ❌ 跳过 hydrateLink 直接 setLinks：tags / board 可能未规范化
const { data } = await client.from('links').select();
setLinks(data);

// ✅ 正解
const { data } = await client.from('links').select();
setLinks(data.map(hydrateLink));
```
