# PROJECT_MAP — 模块边界与数据流

> 「项目长什么样」的不变事实。架构变了再改，日常进度不在这里。

## 1. 全景图（文字版）

```
┌──────────────────────────────────────────────────────────────────┐
│                          浏览器 (SPA)                            │
│                                                                  │
│  index.html → main.jsx → <App /> (src/App.jsx, 页面编排)        │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐              │
│         ▼                    ▼                    ▼              │
│   components/*          hooks/useLinks       lib/linkMeta         │
│   纯 UI 展示            状态/CRUD/筛选        meta 编码/归一化     │
│         │                    │                    │              │
│         │                    ▼                    │              │
│         │           src/lib/supabaseClient.js     │              │
│         │                    │                    │              │
└─────────┼────────────────────┼────────────────────┼──────────────┘
          │                    │ HTTPS (anon key)   │
          ▼                    ▼                    ▼
  PinModal / LinkModal   Supabase Postgres    links.category
  LinkCard / Sidebar     table: public.links  __WINKS_META__ JSON
```

## 2. 模块职责

### 2.1 入口层

| 文件 | 职责 | 不该做的事 |
|---|---|---|
| [index.html](../../index.html) | 挂载 #root，加载 main.jsx；引用 `public/favicon.svg`（品牌黄 + 白色品牌闪电） | 不要写死部署绝对路径（保持 Vite `base: './'`） |
| [src/main.jsx](../../src/main.jsx) | React StrictMode + ReactDOM root；导入 3 套 @fontsource-variable 自托管字体 | 不放业务逻辑 |
| [src/index.css](../../src/index.css) | Tailwind 入口 + **设计 token `:root`**（品牌色阶 `--brand-*`、`--brand-foreground` 黑配黄、`--brand-text` 白底金字、字体栈 `--font-sans/display/mono`） | 不写业务样式（用 Tailwind utility）；token 是颜色单一事实源，见 [adr-0005](../30-decisions/adr-0005-brand-tokens-and-self-hosted-fonts.md) |
| [tailwind.config.js](../../tailwind.config.js) | 把 `:root` token 映射成 `bg-brand`/`text-brand`/`font-display` 等类（`colors.brand` + `fontFamily`） | hex 变量不支持 `/opacity` 修饰，彩色阴影用字面 `rgba(255,208,0,…)` |

### 2.2 页面编排层

| 文件 | 职责 | 不该做的事 |
|---|---|---|
| [src/App.jsx](../../src/App.jsx) | 组合导航、看板按钮、筛选按钮、列表、弹窗、页脚 | 不放 Supabase CRUD；不内联 meta 编码逻辑 |

### 2.3 UI 组件层

| 文件 | 职责 | 不该做的事 |
|---|---|---|
| [src/components/PinModal.jsx](../../src/components/PinModal.jsx) | PIN 输入 + 校验（硬编码 `5185`） | 不调用 Supabase；不把 PIN 当强安全 |
| [src/components/Logo.jsx](../../src/components/Logo.jsx) | 视觉品牌 | 不放业务状态 |
| [src/components/LinkCard.jsx](../../src/components/LinkCard.jsx) | 链接卡展示、favicon 多源级联、复制链接、触发编辑/删除回调、打开时回调 `onOpen`（点击计数） | 不直接修改 links |
| [src/components/LinkModal.jsx](../../src/components/LinkModal.jsx) | 新增/编辑表单、标签/分类就地增删入口 | 不直接写数据库 |
| [src/components/CategorySidebar.jsx](../../src/components/CategorySidebar.jsx) | 桌面侧栏 + `MobileCategoryBar` 移动端分类切换（渲染 `displayClassifications`，未分类置底） | 不持有分类数据源 |
| [src/components/LinkGridSkeleton.jsx](../../src/components/LinkGridSkeleton.jsx) | 首屏加载骨架（镜像 LinkCard 盒型，替代裸 spinner） | 不放业务状态 |
| [src/components/ModalDialog.jsx](../../src/components/ModalDialog.jsx) | 原生 `<dialog>` 模态焦点边界与关闭后焦点恢复 | 不持有业务状态 |
| [src/components/TaxonomyEditor.jsx](../../src/components/TaxonomyEditor.jsx) | 分类/标签选择、删除和就地新增的共享 UI | 不修改 links 或调用 Supabase |

### 2.4 状态与数据层

| 文件 | 职责 |
|---|---|
| [src/hooks/useLinks.js](../../src/hooks/useLinks.js) | links / boardOptions / filters / modal state；Supabase CRUD；PIN 流程编排；SWR 缓存接线；点击计数与热度排序。内部 `runBatchUpdate` / `runSingleMutation` 负责 demo/Supabase 分支 |
| [src/lib/constants.js](../../src/lib/constants.js) | `DEFAULT_*`、`LINK_META_PREFIX`、`APP_VERSION`、`USE_DEMO_MODE`、`ADMIN_PIN`、`ALL_FILTER`、含删标签的 `PIN_ACTIONS`、`LINKS_CACHE_KEY` |
| [src/lib/linkMeta.js](../../src/lib/linkMeta.js) | `encodeLinkMeta` / `decodeLinkMeta` / `hydrateLink`（含 clicks 兜底）/ tag/classification/board 归一化 / `getFaviconCandidates`（多源）/ `sortClassificationsUncategorizedLast`（未分类置底） |
| [src/lib/linkActions.js](../../src/lib/linkActions.js) | 纯函数：`applyTagDeleteLocally` / `applyClassificationDeleteLocally` / `normalizeSaveLinkData` / `getBoardOption` / `withBoardValues`。可被 Node 测试 |
| [src/lib/linksCache.js](../../src/lib/linksCache.js) | localStorage 缓存读写；空列表覆盖旧快照；读取路径统一 `hydrateLink` |
| [src/lib/supabaseClient.js](../../src/lib/supabaseClient.js) | 单例懒加载 Supabase client；模块加载即 `warmSupabase()`（preconnect + 预拉 SDK chunk，与 React 挂载并行）；`getSupabaseInitError()` 用于 UI 显式错误 |
| [supabase/schema.sql](../../supabase/schema.sql) | `links` 表 schema（含 clicks 非负约束 + 索引）+ 完全开放的 RLS 策略；当前迁移结果快照 |

## 3. 数据流（典型路径）

### 3.1 加载（fetch，stale-while-revalidate）

```
useState 初始化 → linksCache.readLinksCache()（含已缓存空列表；命中则 loading=false）
useLinks.useEffect → fetchLinks（不再 setLoading(true)，避免覆盖已渲染内容）
  → resolveSupabaseClient（demo 跳过；客户端已被 supabaseClient 模块预热）
  → client.from('links').select('*').order('created_at', desc)
  → data.map(hydrateLink)        ← 解析 __WINKS_META__ 前缀 + clicks 兜底
  → setLinks + setBoardOptions(buildBoardOptionsFromLinks(...))
  → writeLinksCache(links)（effect 监听 links 变更回写缓存）
```

### 3.1b 打开链接（点击计数）

```
LinkCard <a onClick> → onOpen(link) → useLinks.handleOpenLink
  → 乐观 setLinks（clicks+1）→ filteredLinks 重排
  → persistClick(link)：fire-and-forget update({clicks})（非 PIN；列缺失则静默降级）
```

### 3.2 写入（insert / update）

```
LinkModal.onSave → useLinks.handleSaveLink
  → 规范化 tags / classification / board
  → encodeLinkMeta(...) → 写入 links.category 字段
  → client.from('links').insert/update(...).select()
  → 返回结果再 hydrateLink → 合并入 setLinks / setBoardOptions
```

### 3.3 删除（delete-link / delete-tag / delete-classification）

```
触发按钮 → requestAuth({type, payload}) → PinModal
  → onSuccess → executeDelete*
  → demo 模式：仅本地 state
  → Supabase 模式：批量 update（删 tag/分类时回写受影响行）+ 本地同步
```

## 4. 当前结构

```
src/
├── App.jsx                    # ≤ 200 行，页面编排 + 移动端分类条挂载位置
├── components/
│   ├── PinModal.jsx
│   ├── LinkCard.jsx
│   ├── LinkModal.jsx
│   ├── LinkGridSkeleton.jsx
│   ├── ModalDialog.jsx
│   ├── TaxonomyEditor.jsx
│   ├── CategorySidebar.jsx    # 桌面侧栏 + MobileCategoryBar
│   └── Logo.jsx
├── hooks/
│   └── useLinks.js            # CRUD + 本地状态 + 筛选
├── lib/
│   ├── constants.js
│   ├── linkActions.js         # 纯函数 action helpers（P1 抽取）
│   ├── linkActions.test.js
│   ├── linkMeta.js
│   ├── linkMeta.test.js
│   ├── linksCache.js
│   ├── linksCache.test.js
│   └── supabaseClient.js
└── ...
```

## 5. 边界与禁忌

- **前后端合同唯一字段是 `links.category`**。所有 board/tags/classification 的语义都通过它流通。改它前先读 [data-model.md](../10-spec/data-model.md)。
- **不要在 UI 组件里调用 Supabase**：所有写操作收敛在 [useLinks.js](../../src/hooks/useLinks.js)。
- **不要在 hook 之外调用 `setBoardOptions`**：保证派生一致性。
- **不要假设 Supabase 已初始化**：所有调用必须经 `resolveSupabaseClient` 走 demo / error 分支。

## 6. 术语表

| 词 | 含义 |
|---|---|
| Board（看板） | 顶层分组，硬编码 `['网站', '页面']` |
| Classification（分类） | 看板内的一级分组（"未分类" / 自定义） |
| Tag（标签） | 链接的多选标签（`#xxx`） |
| Meta | 写入 `links.category` 的 `__WINKS_META__{json}` payload |
| Hydrate | 把数据库行解析成前端使用的 `{board, category, tags}` 形状 |
| PIN | 前端硬编码的 4 位口令（`5185`） |
