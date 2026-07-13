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
- [x] `useLinks.js`：589 → 498 行（P1 完成时的快照；后续功能扩展后现约 590 行，仍低于 800 行红线）
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
- [x] **已上线 + 人工迁移已执行**：2026-06-25 部署 + 用户在 Supabase 跑迁移，REST 实测 clicks 列生效（withoa 真实点击落库并排首位）

### P1-6：favicon 策略迭代（应对挂起/限流/SVG 声明）✅ 2026-06-26（Claude Opus 4.8）

用户反馈 withoa 图标歪/不符、蓝湖仍缺省。逐源实测 + 下载肉眼比对后定位多个陷阱并修复：

- [x] Google s2「伪成功」地球图（200/301）卡住级联 → 改 origin-first
- [x] 单服务批量被 gstatic 限流（整屏卡片 16px 占位）→ **origin-first 分散负载**：`getFaviconCandidates` 返回 `[{/icon.svg 2s},{/favicon.ico 3s},{faviconV2 6s}]`，每源独立超时；faviconV2 占位（≤16px）启发式直接落首字母
- [x] withoa 声明 `/icon.svg` → 直接取站点矢量图（铺满、上正、忠实），不再用服务端栅格
- [x] 实测线上覆盖率回升（~19/26，余为 data-URI 内联图标等不可抓取站）

### P1-7：品牌色 token 化 + 自托管字体（设计系统）✅ 2026-06-26（Claude Opus 4.8）

落地 WithMedia 品牌规范，多 Agent 对抗式审查（14 Agent）后修可达性回归。详见 [ADR-0005](../30-decisions/adr-0005-brand-tokens-and-self-hosted-fonts.md)。

- [x] 颜色 token 化：`index.css :root` 品牌色阶 + `tailwind.config` 映射 `bg-brand`/`text-brand`/…；全站 `yellow-*` → `brand`（6 文件 ~30 处，含 `public/favicon.svg`）
- [x] **黑配黄**：`bg-brand text-brand-foreground` 取代白字黄底（顺带解决 P2-4 对比度）
- [x] 自托管字体：`@fontsource-variable/{space-grotesk,noto-sans-sc,jetbrains-mono}`，脱离 Google CDN，CJK 按需子集；`font-display` 标题/Logo、`font-mono` 数字
- [x] 首字母块：`#0052D9` 蓝底 + 白字 + 字号 +30%（text-lg→2xl）
- [x] 审查修复：新增 `--brand-text #8A6800`（白底金字过 AA，替换低对比 `text-brand-600/500` hover）；PIN 锁图标 `brand-700`；favicon 改 #FFD000 + 近黑闪电；PIN 输入去 mono（中文 placeholder）
- [x] 验证：`npm test` 18/18、`npm run lint`、`npm run build`；浏览器 DOM+截图（`--brand`=#ffd000、3 套字体已加载、首字母块）

### P1-8：品牌配色改「白配黄」+ 首字母块调整 ✅ 2026-06-26（Claude Opus 4.8）

用户指令：全站不要黄黑配色，改黄白配色（品牌黄底 + 白色图形/白字）；首字母块改品牌黄底 + 白字、字号 21px。

- [x] 全量反转 `bg-brand text-brand-foreground`/`fill-brand-foreground` → `bg-brand text-white`/`fill-white`（按钮/激活态/Logo 闪电/Modal 按钮/编辑按钮 hover）；`public/favicon.svg` 闪电改白
- [x] 首字母块：`#0052D9` 蓝底 → `bg-brand` 品牌黄底，白字，`text-2xl` → `text-[21px]`
- [x] `--brand-foreground`（近黑）仅留浅黄底 `brand-200` 选区高亮（白字在浅黄不可读的可读例外）
- [x] 验证：`npm test` 18/18、lint、build；浏览器 DOM（激活按钮 bg #FFD000 + 白字、首字母块 #FFD000 + 白字 + 21px）+ 截图
- ⚠ 记录：白字/品牌黄对比度低（≈1.47:1，不过 WCAG），属当时的品牌选型；本轮已按 ADR-0006 修正功能控件文字颜色

### P1-9：全量 Skills 审计 + WCAG/数据/交付闭环 ✅ 2026-07-13（Codex）

- [x] 覆盖审计开始时的 57 个项目文件，并复核本轮新增实现/规范文件：源码、测试、配置、锁文件、工作流、hook、SQL/迁移、文档与历史截图资产。
- [x] 数据正确性：新增 `links_clicks_nonnegative_check` 迁移；`hydrateLink` 归一为非负整数；空数组缓存可覆盖旧快照；远端空行更新返回失败而非误报成功。
- [x] 权限合同：删除标签纳入 `requestAuth → PinModal → executeDeleteTag`，与 ADR-0002 一致。
- [x] WCAG：功能性黄底改近黑字；低对比灰字/placeholder 上调；筛选态补 `aria-pressed`；补 skip link、全局可见焦点、reduced motion 与 ≥24px 目标。
- [x] 弹窗：统一原生 `<dialog>`，阻止焦点进入背景交互控件并恢复触发焦点；移动端视口与滚动实测通过。
- [x] 可维护性：抽取 `ModalDialog` / `TaxonomyEditor` / `linksCache`；`App.jsx` 保持 200 行，`LinkModal.jsx` 397 → 269 行。
- [x] 交付：新增 `npm run verify` 与最小权限质量 CI；部署前自动 verify；pre-commit 缺 npm 时失败关闭并补可执行位；keepalive 增加超时/重试；无 seed 项目关闭 seed。
- [x] 依赖：`npm audit fix` 非破坏性清除 Babel / js-yaml 可修项；生产依赖 0 漏洞。
- [x] 发布：实现提交 `2ddac5e` 已推送；Quality workflow 成功；Pages `5c0aa593` built；生产 Supabase 200、28 张卡片、弹窗和首行对齐 smoke 通过。
- [x] 防复发：`predeploy` 在 Supabase 模式缺少公开运行变量时失败关闭，Demo 发布须显式启用 `VITE_DEMO_MODE=true`。
- [ ] **远端待执行**：`supabase db push` 应用 `20260713090000_links_clicks_nonnegative_check.sql`；本轮未直接修改生产数据库。
- [ ] **人工决策**：开放 RLS / 前端明文 PIN 仍按 ADR-0002 保留；Vite 8 major 升级另开专题。

### P1-10：卡片一句话简介 + 复制按钮收敛 🚧 2026-07-13（Codex）

- [x] 设计确认：简介为可选独立列、最多 15 字；空值保留一行；现有 36 条采用客观功能型文风回填。
- [x] TDD：新增简介 trim/长度/hydrate、保存空值为 `null`、缓存 v2 合同测试；先观察 5 项预期失败，再实现至 25/25 通过。
- [x] 数据：生成 `20260713102800_add_link_descriptions.sql`，36 个生产 UUID 与迁移映射逐项比对，无遗漏或重复。
- [x] UI：简介位于标题与标签之间；复制按钮改为左下角 28×28 纯图标，保留动态辅助名称、提示和焦点环。
- [x] 对齐：首字母回退块由 36×36 统一为与 favicon 相同的 40×40；桌面同行坐标一致，390px 移动端所有验收卡同高 226px。
- [x] 新增表单：简介可不填、可清空，`maxLength=15`；移动端 dialog 完整入视口。
- [ ] 远端与发布：提交/push 后先应用并验证 Supabase 迁移，再部署 GitHub Pages 和生产 smoke。

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
- [x] **2026-07-13** `PinModal` / `LinkModal` 已统一原生 `<dialog>`，并补关闭后焦点恢复
- [ ] 评估 `LinkModal` 多个相关 state 是否改为 `useReducer`
- [x] **2026-07-13** WCAG AA 功能对比度闭环：黄底功能文字/图标用近黑；白色仅保留非交互品牌闪电与装饰性首字母 fallback。见 [ADR-0006](../30-decisions/adr-0006-wcag-aa-interaction-baseline.md)

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
| ~~`useLinks.js` 中 action 函数仍偏长~~ | ~~后续协作冲突、测试困难~~ | 已通过 `linkActions` 抽取主要纯逻辑；剩余 hook 总长低于单文件红线 |
| 组件缺少 React 层测试 | UI 回归只能靠 smoke | P2 评估 Vitest + Testing Library |
| ~~外部 favicon 404 噪音~~ | ~~Playwright 控制台有非业务错误~~ | ✅ 2026-06-25 落地多源级联 `getFaviconCandidates`（Google→直连→DuckDuckGo），命中率显著提升 |
| Vite/esbuild dev-only 1 高 + 1 中审计项 | 本地 dev server 在特定条件下有暴露风险 | P2 独立分支验证 Vite 8 major 升级；开发服务仅绑定 127.0.0.1 |
| ~~自定义 modal 未迁移 `<dialog>`~~ | ~~无障碍与浏览器原生焦点管理仍可改进~~ | 2026-07-13 已迁移并通过键盘/移动端验收 |
