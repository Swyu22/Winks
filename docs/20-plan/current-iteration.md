# Current Iteration

> 当前迭代的 checklist。完成后归档到 `docs/20-plan/archive/`，并新建下一份。
> 进度只在这里更新；总纲 / 快照分别在 `CLAUDE.md` / `.cloud.md`。

**迭代名**：Iter-2026-05A — SSOT 接手与 App.jsx 拆分铺垫
**起始**：2026-05-09
**目标日期**：未定（P1/P2 后续单独规划）

---

## 1. 已完成

- [x] **2026-05-09** 建立 SSOT 骨架：
  - [x] `CLAUDE.md`（项目总纲）
  - [x] `.cloud.md`（当前快照）
  - [x] `docs/00-context/PROJECT_MAP.md`
  - [x] `docs/10-spec/data-model.md`
  - [x] `docs/30-decisions/adr-0001-meta-encoding-in-category.md`
  - [x] `docs/30-decisions/adr-0002-frontend-pin-only-auth.md`
  - [x] `scripts/git-hooks/pre-commit`（注册 `core.hooksPath`）
- [x] **2026-05-09** 将候选 worktree 的 SSOT 文档与 hook 回填到当前根仓库。
- [x] **2026-05-09** 完成 P0-1：拆分 [src/App.jsx](../../src/App.jsx)（1478 行 → 182 行）。
- [x] **2026-05-09** 完成 Skills 审计首轮自动修复：
  - [x] 新增 `.env.example`
  - [x] `npm audit fix` 非破坏性修复依赖漏洞（剩余 Vite/esbuild 需 major 升级确认）
  - [x] 修复部分 UI 可访问性：dialog 标注、icon button `aria-label`、表单 `name` / `autoComplete`、图片尺寸
  - [x] 修复 `linkMeta` 纯函数性能提示与死导出

## 2. 已完成（P0）

### P0-1：拆分 [src/App.jsx](../../src/App.jsx)（1478 行 → 多文件）

- [x] 抽取 `src/lib/constants.js`：`DEFAULT_BOARDS` / `DEFAULT_TAGS` / `DEFAULT_CLASSIFICATIONS` / `LINK_META_PREFIX` / `APP_VERSION`
- [x] 抽取 `src/lib/linkMeta.js`：`normalizeName` / `normalizeTag` / `parseTags` / `uniqueTags` / `uniqueClassifications` / `formatTag` / `isKnownBoard` / `encodeLinkMeta` / `decodeLinkMeta` / `hydrateLink` / `collectTagsFromLinks` / `collectClassificationsFromLinks` / `buildBoardOptionsFromLinks` / `getFaviconUrl`
- [x] 新增 `src/lib/linkMeta.test.js`，使用 Node 内置 test runner 覆盖 meta 编码、hydrate、legacy 兼容与 board options
- [x] 抽取 `src/components/PinModal.jsx`
- [x] 抽取 `src/components/Logo.jsx`
- [x] 抽取 `src/components/LinkCard.jsx`
- [x] 抽取 `src/components/LinkModal.jsx`
- [x] 抽取 `src/components/CategorySidebar.jsx`
- [x] 抽取 `src/hooks/useLinks.js` 承接 links / boardOptions / filters / Supabase CRUD / PIN 流程
- [x] 收敛 `App.jsx` 至编排逻辑（182 行，≤ 200 行）
- [x] 新增 `docs/30-decisions/adr-0003-app-jsx-split.md`（拆分边界与命名约定）
- [x] 验证：`npm test` / `npm run lint` / `npm run build` 通过；Playwright smoke 覆盖页面加载、看板切换、新增弹窗

## 3. 已完成（P1）

### P1-1：抽取「本地+远程同步」模式 ✅ 2026-05-09

`executeDeleteTag` / `executeDeleteClassification` / `handleSaveLink` 已重构：

- [x] 抽取 `src/lib/linkActions.js`（84 行）：纯函数 `applyTagDeleteLocally` / `applyClassificationDeleteLocally` / `normalizeSaveLinkData` / `getBoardOption` / `withBoardValues`
- [x] 新增 `src/lib/linkActions.test.js`：9 个 Node 内置测试，覆盖边界与 board 隔离
- [x] 在 hook 内提取 `runBatchUpdate` / `runSingleMutation` 两个 callback helper 统一 demo/Supabase 分支
- [x] 进一步拆分 `handleSaveLink` → `executeUpdateLink` + `executeCreateLink` + 10 行入口函数
- [x] `useLinks.js`：589 → 498 行（P1 完成时的快照；现 511 行，含 2026-06-14 resync 补丁）；所有 action 函数 ≤ 30 行
- [x] 验证：`npm test` 15/15 pass、`npm run lint` 零错误、`npm run build` 通过

### P1-2：综合审计（simplify + security-review + 手动）✅ 2026-05-09

- [x] 调用 `simplify` skill：3 个并行 agent（reuse / quality / efficiency）
- [x] 调用 `security-review` skill：聚焦本分支变更
- [x] 手动审计：configs / 环境 / 构建 / 文档 / SQL schema
- [x] 关键修复（数据正确性）：`runBatchUpdate` Promise.all → `Promise.allSettled` + 失败时 `fetchLinks()` resync
- [x] 关键修复（双 alert bug）：`resolveSupabaseClient` 内部自负责 null 路径，callers 不再二次弹
- [x] 常量化：`ADMIN_PIN`、`ALL_FILTER`、`PIN_ACTIONS`（替换字面量约 18 处）
- [x] 优化：`withBoardValues` no-op 短路、`runBatchUpdate` 空 affectedLinks 短路
- [x] 删除/修正注释：4 处描述 WHAT 的注释删除，2 处 WHY 注释新增
- [x] 文档同步：`src/README.md`、ADR-0002、`CLAUDE.md` 目录结构、`.cloud.md`
- [x] 验证：`npm test` 15/15、`npm run lint` 零错误、`npm run build` 通过

### P1-3：Skills 综合审计复跑 ✅ 2026-06-05

- [x] 自动筛选并使用适用 Skills：`code-review` / `security-review` / `insecure-defaults` / `react-doctor` / `javascript-pro` / `frontend-design` / `documentation` / `code-simplifier` / `devex-review` / `qa`
- [x] 恢复本地依赖安装，修复 `npm run lint` / `npm run build` 找不到本地二进制的问题
- [x] `npm audit fix` 非破坏性升级 `ws` 到 8.21.0；剩余 Vite/esbuild dev-only 中危需 major 升级确认
- [x] `LinkModal` 移除打开弹窗时的 prop-sync effect，改为挂载初始化 + 提交时安全派生
- [x] 补齐按钮 `type` 与无文本输入控件可访问名称
- [x] 拆出 `MobileCategoryBar`，修复移动端分类条被 fixed 顶栏遮挡的问题
- [x] 验证：`npm test` 15/15、`npm run lint`、`npm run build`、React Doctor 93 → 98、Playwright 桌面/移动 smoke 通过

### P1-4：Skills 综合审计复跑（多 Agent + 对抗式验证）✅ 2026-06-14（Claude Opus 4.8）

- [x] 7 维并行审查（正确性 / React+a11y / 安全 / CI+配置 / Supabase SQL / 文档 / 质量），每条发现独立对抗式验证，过滤 ADR 刻意选型误报
- [x] 正确性：`runSingleMutation` 无 error 但空返回行时改 `fetchLinks()` resync；`LinkCard` 在 `link.url` 变更时重置 `imgError`
- [x] 安全：新增 `toSafeHref` href http(s) 白名单（render sink 纵深防御）+ Node 单测
- [x] 可访问性：`PinModal` / `LinkModal` 补 Esc 关闭 + 初始焦点；`PinModal` 错误改为常驻 `aria-live` 区域
- [x] CI / 配置：keepalive workflow 加 `permissions: {}` + `set -euo pipefail`；`package.json` 加 `engines.node>=18`
- [x] 文档：修 CLAUDE/AGENTS git-hook 自相矛盾；校正 `.cloud.md` 行数；补 PROJECT_MAP 常量清单；`.env.example` 默认说明
- [x] 验证：`npm test` 16/16、`npm run lint` 0 错、`npm run build` 通过
- [ ] 需人工确认：WCAG AA 对比度（白字/黄底、灰字/白底）—— 见 P2-4，未擅自改色

### P1-5：加载性能 + favicon 命中率 + 点击计数排序 + 未分类置底 ✅ 2026-06-25（Claude Opus 4.8）

需求：线上加载慢、很多 favicon 抓不到（如 withoa）、链接无排序、侧栏未分类应置底。多 Agent 理解 + 实现 + 对抗式审查（19 Agent，5 条确认发现已修）+ demo 浏览器冒烟。

- [x] **性能**：localStorage SWR 缓存（秒出 + 后台 revalidate，读路径经幂等 hydrateLink）；`supabaseClient` 模块加载即 `warmSupabase()`（preconnect + 预拉 SDK chunk）；spinner → `LinkGridSkeleton` 骨架；vite `manualChunks` 拆 React vendor（入口 chunk 56.5KB→12.3KB gz）；keepalive 6 天 → 3 天
- [x] **favicon**：`getFaviconUrl` → `getFaviconCandidates` 多源级联（Google s2 sz=128 → 直连 /favicon.ico → DuckDuckGo），`LinkCard` onError 逐级降级，耗尽才显示首字母
- [x] **点击计数**：新增 `links.clicks` 列（[ADR-0004](../30-decisions/adr-0004-clicks-as-dedicated-column.md)）；`hydrateLink` 兜底带出；`handleOpenLink` 乐观自增 + `persistClick` 容错持久化（非 PIN、列缺失静默降级）；`filteredLinks` 按 clicks 降序、created_at 兜底
- [x] **未分类置底**：`sortClassificationsUncategorizedLast` 仅用于侧栏渲染（`displayClassifications`）；`activeClassifications` 保持未分类在前供逻辑（删分类回退 / 新建默认），避免审查发现的孤儿错分类回归
- [x] 文档：data-model（clicks 列/形状/校验）、PROJECT_MAP、ADR-0004、schema.sql
- [x] 验证：`npm test` 18/18、`npm run lint` 0 错、`npm run build` 通过、demo 浏览器冒烟（排序/置底/favicon 正确、控制台 0 报错）
- [ ] **需人工执行**：在 Supabase SQL Editor 跑一次幂等迁移使 clicks 生效（见 ADR-0004 §5 / schema.sql）；未执行前前端静默降级（计数恒 0、按时间排序）

## 4. 待规划（P2）

### P2-1：PIN 配置化

- [ ] 评估 `VITE_ADMIN_PIN` 环境变量的影响面（部署、Demo 模式、文档）
- [ ] 评估是否引入二次确认 / 时长锁

### P2-2：测试栈引入

- [ ] 调研 Vitest + @testing-library/react 引入成本
- [x] 优先覆盖 `linkMeta.js` 的纯函数（hydrate / encode / decode）
- [x] 覆盖 `useLinks` action helpers 抽出的 `linkActions.js`
- [ ] 评估 React 组件 / hook 层测试覆盖（特别是 `LinkModal`、PIN 流程、移动分类条）

### P2-3：Vite major 升级评估

- [ ] 评估 `vite@8` 与 `@vitejs/plugin-react` 兼容性
- [ ] 在独立分支验证 `npm audit fix --force`
- [ ] 验证 GitHub Pages 部署产物是否保持 `base: './'`

### P2-4：React Doctor 剩余项

- [x] **2026-06-14** 补齐两个自定义 modal 的 Esc 关闭 + 初始焦点（最小无障碍修复，未迁 `<dialog>`）
- [ ] 评估 `PinModal` / `LinkModal` 是否迁移到原生 `<dialog>`（含完整 Tab focus-trap）
- [ ] 评估 `LinkModal` 多个相关 state 是否改为 `useReducer`
- [ ] **需人工确认**：WCAG AA 对比度 —— `bg-yellow-400 text-white`（活动 Tab/分类/标签/确认按钮，全站品牌色）与 `text-gray-400`（空态/页脚等次要文字）。属调色决策，需统一确认是否调深文字色或加深背景

## 5. 不在本迭代

- 路由库、状态管理库、CMS 后台、多用户认证、链接抓取/缩略图——见 `.cloud.md` §6。

## 6. 退出条件（本迭代视为完成）

- [x] App.jsx 拆分完毕，`npm run build` 通过
- [x] ADR-0003 已落地
- [x] `.cloud.md` / `PROJECT_MAP.md` 同步更新到拆分后状态
- [x] `ai/sessions/` 含完整里程碑记录

## 7. 风险登记

| 风险 | 影响 | 缓解 |
|---|---|---|
| ~~私有仓库无法在当前账户方案启用 GitHub Pages~~ | ~~`www.winks.ink` 现有发布可能下线~~ | 已于 2026-06-05 恢复仓库 public，并恢复 `gh-pages:/` 发布源 |
| `useLinks.js` 中 action 函数仍偏长 | 后续协作冲突、测试困难 | P1 拆 action helpers |
| 组件缺少 React 层测试 | UI 回归只能靠 smoke | P2 评估 Vitest + Testing Library |
| ~~外部 favicon 404 噪音~~ | ~~Playwright 控制台有非业务错误~~ | ✅ 2026-06-25 落地多源级联 `getFaviconCandidates`（Google→直连→DuckDuckGo），命中率显著提升 |
| Vite/esbuild dev-only 中危审计项 | 本地 dev server 在特定条件下有暴露风险 | P2 独立分支验证 Vite major 升级 |
| 自定义 modal 未迁移 `<dialog>` | 无障碍与浏览器原生焦点管理仍可改进 | P2 独立处理，避免混入本轮审计 |
