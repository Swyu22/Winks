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
- [x] `useLinks.js`：589 → 498 行；所有 action 函数 ≤ 30 行
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

## 4. 待规划（P2）

### P2-1：PIN 配置化

- [ ] 评估 `VITE_ADMIN_PIN` 环境变量的影响面（部署、Demo 模式、文档）
- [ ] 评估是否引入二次确认 / 时长锁

### P2-2：测试栈引入

- [ ] 调研 Vitest + @testing-library/react 引入成本
- [x] 优先覆盖 `linkMeta.js` 的纯函数（hydrate / encode / decode）
- [ ] 继续覆盖 `useLinks` action helpers（需先做 P1 拆分）

### P2-3：Vite major 升级评估

- [ ] 评估 `vite@8` 与 `@vitejs/plugin-react` 兼容性
- [ ] 在独立分支验证 `npm audit fix --force`
- [ ] 验证 GitHub Pages 部署产物是否保持 `base: './'`

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
| `useLinks.js` 中 action 函数仍偏长 | 后续协作冲突、测试困难 | P1 拆 action helpers |
| 组件缺少 React 层测试 | UI 回归只能靠 smoke | P2 评估 Vitest + Testing Library |
| 外部 favicon 404 噪音 | Playwright 控制台有非业务错误 | 目前不影响页面功能；如需可后续加 favicon fallback 策略 |
