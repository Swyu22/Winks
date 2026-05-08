# src module

`src` 是 Winks.闪链的前端应用模块。当前边界如下：

| 路径 | 职责 |
|---|---|
| `App.jsx` | 页面编排：导航、看板按钮、筛选按钮、列表、弹窗、页脚 |
| `components/` | 纯 UI 组件（PinModal/Logo/LinkCard/LinkModal/CategorySidebar），不直接调用 Supabase |
| `hooks/useLinks.js` | links 状态、board/tag/classification 派生、筛选、PIN 流程、Supabase CRUD（内部 `runBatchUpdate` / `runSingleMutation` 统一 demo/Supabase 分支） |
| `lib/constants.js` | 默认集合、`APP_VERSION`、`USE_DEMO_MODE`、`ADMIN_PIN`、`ALL_FILTER`、`PIN_ACTIONS` |
| `lib/linkMeta.js` | `links.category` 的 `__WINKS_META__` 编码/解码/归一化 |
| `lib/linkActions.js` | 纯函数 action helpers：`applyTagDeleteLocally` / `applyClassificationDeleteLocally` / `normalizeSaveLinkData` / `getBoardOption` / `withBoardValues` |
| `lib/supabaseClient.js` | Supabase client 懒加载与初始化错误封装 |

修改 `links.category`、`DEFAULT_BOARDS`、PIN、Supabase 写路径前，先读根目录 `CLAUDE.md`、`.cloud.md`、`docs/10-spec/data-model.md` 和相关 ADR。

当前测试：

```bash
npm test
```

该命令使用 Node 内置 test runner，覆盖 `lib/linkMeta.js` 与 `lib/linkActions.js` 的纯函数合同（共 15 个测试）。

本地环境变量模板位于根目录 `.env.example`。不要提交 `.env`。
