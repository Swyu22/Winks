# ADR-0003 — 拆分 `App.jsx` 为编排层、组件层、状态 Hook 与 Meta 工具

- **状态**：Accepted
- **日期**：2026-05-09
- **作者**：Codex
- **关联**：[PROJECT_MAP.md](../00-context/PROJECT_MAP.md)、[src/App.jsx](../../src/App.jsx)、[src/hooks/useLinks.js](../../src/hooks/useLinks.js)、[src/lib/linkMeta.js](../../src/lib/linkMeta.js)

## 1. 背景

拆分前 [src/App.jsx](../../src/App.jsx) 约 1478 行，同时承载 UI、状态、Supabase CRUD、meta 编码/解码、PIN 流程与筛选逻辑，已经超过项目单文件 ≤800 行红线。跨设备/跨模型协作时，所有改动都集中在同一文件，容易产生冲突，也让 `links.category` 的隐性合同更难保护。

## 2. 备选方案

### 方案 A：仅抽 UI 组件，状态仍留在 `App.jsx`

优点：改动小，最少移动业务逻辑。
缺点：`App.jsx` 仍然偏长，CRUD 与派生状态仍难测试，不能满足 ≤200 行编排目标。

### 方案 B：一次性引入状态管理库

优点：状态边界清晰，后续扩展空间大。
缺点：引入新依赖和新范式，当前状态规模不需要 zustand/redux；违反“不擅自添加新依赖”的协作约束。

### 方案 C：抽组件 + `useLinks()` Hook + `linkMeta` 纯函数（现采用）

优点：无新增依赖；`App.jsx` 收敛为页面编排；`linkMeta` 可用 Node 内置测试覆盖；Supabase 写操作统一收口在 hook。
缺点：`useLinks.js` 暂时承接较多 action 逻辑，部分函数仍超过 30 行，需要 P1 继续拆分 action helpers。

## 3. 选择：方案 C

选择方案 C，是因为当前最急的风险是单文件过大和 meta 合同散落。将纯函数先抽到 [src/lib/linkMeta.js](../../src/lib/linkMeta.js)，能用低成本测试保护 `encodeLinkMeta` / `decodeLinkMeta` / `hydrateLink`；将 UI 组件移到 [src/components](../../src/components)，能降低日常 UI 修改冲突；将 CRUD 和 PIN 编排移到 [src/hooks/useLinks.js](../../src/hooks/useLinks.js)，能让 [src/App.jsx](../../src/App.jsx) 保持页面装配角色。

## 4. 影响

### 必须遵守

1. UI 组件不直接调用 Supabase。
2. 所有 `links.category` 写入仍必须经过 `encodeLinkMeta()`。
3. 所有读路径仍必须经过 `hydrateLink()`。
4. 新增 board/tag/classification 派生逻辑优先放在 `linkMeta.js` 或 `useLinks.js`，不要回流到 `App.jsx`。
5. `useLinks.js` 中本地/远程同步重复模式是 P1 技债，不应继续在组件层复制。

### 验证要求

- `npm test`
- `npm run lint`
- `npm run build`
- 页面加载、看板切换、新增弹窗 smoke

