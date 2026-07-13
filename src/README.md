# src module

`src` 是 Winks.闪链的前端应用模块。当前边界如下：

| 路径 | 职责 |
|---|---|
| `App.jsx` | 页面编排：导航、看板按钮、筛选按钮、列表、弹窗、页脚 |
| `components/` | 纯 UI 组件；`LinkCard` 展示可选简介和 28px 复制图标按钮，`ModalDialog` 统一原生 dialog，`TaxonomyEditor` 统一分类/标签编辑，不直接调用 Supabase |
| `hooks/useLinks.js` | links 状态、board/tag/classification 派生、筛选、PIN 流程、Supabase CRUD（内部 `runBatchUpdate` / `runSingleMutation` 统一 demo/Supabase 分支） |
| `lib/constants.js` | 默认集合、简介长度、`APP_VERSION`、`USE_DEMO_MODE`、`ADMIN_PIN`、`ALL_FILTER`、`PIN_ACTIONS` |
| `lib/linkMeta.js` | `links.category` 的 `__WINKS_META__` 编解码，以及简介、点击数和 legacy 行归一化 |
| `lib/linkActions.js` | 纯函数 action helpers：分类/标签本地变更与链接保存载荷归一化（空简介写 `null`） |
| `lib/linksCache.js` | localStorage SWR 缓存读写；区分“无缓存”和“已缓存空列表”，读取统一 hydrate |
| `lib/supabaseClient.js` | Supabase client 懒加载与初始化错误封装 |

修改 `links.category`、`DEFAULT_BOARDS`、PIN、Supabase 写路径前，先读根目录 `CLAUDE.md`、`.cloud.md`、`docs/10-spec/data-model.md` 和相关 ADR。

当前测试：

```bash
npm test
```

该命令使用 Node 内置 test runner，覆盖 `linkMeta`、`linkActions` 与 `linksCache` 的纯函数合同（共 25 个测试）。完整本地门禁使用 `npm run verify`。

当前 UI 质量基线：

```bash
npx -y react-doctor@latest . --verbose
```

2026-07-13 复跑仅剩 3 个与 ADR-0002 开放 RLS / 公开 BaaS 配置同源的安全诊断；React、性能、可访问性与可维护性诊断均已清空。React Doctor 的总分会被这项有意威胁模型显著拉低，需结合 ADR 判断。

本地环境变量模板位于根目录 `.env.example`。不要提交 `.env`。
