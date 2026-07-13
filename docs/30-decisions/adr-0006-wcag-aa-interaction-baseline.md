# ADR-0006 — WCAG 2.2 AA 交互与对比度基线

- **状态**：Accepted
- **日期**：2026-07-13
- **作者**：Codex
- **关联**：[ADR-0005](adr-0005-brand-tokens-and-self-hosted-fonts.md)、[src/index.css](../../src/index.css)、[src/components/ModalDialog.jsx](../../src/components/ModalDialog.jsx)

## 1. 背景

品牌实底曾按视觉偏好统一使用白字，但 `#FFFFFF` / `#FFD000` 对比度约 `1.47:1`，不满足 WCAG AA。两个弹窗也只实现 Esc 与初始焦点，没有完整的模态焦点约束和关闭后焦点恢复。

## 2. 决策

1. 品牌黄实底上的**功能文字与功能图标**统一使用 `--brand-foreground`（`#09090B`）；白色仅保留给不承载操作语义的 Logo / favicon 品牌闪电和装饰性首字母 fallback。
2. 白底次要文字最低使用 Tailwind `gray-500`；表单 placeholder 同样按正文对比度处理。
3. 弹窗统一经原生 `<dialog>.showModal()` 打开，由浏览器提供背景 inert 与键盘焦点边界；共享封装额外恢复触发前焦点。
4. 选择态按钮必须提供 `aria-pressed`；异步/错误状态必须提供可访问名称或 `aria-live`。
5. 可见交互目标不得小于 `24 × 24 CSS px`；仅 hover 出现的操作也必须在 `focus-within` 时可见。
6. 全站提供 `:focus-visible` 焦点轮廓与 `prefers-reduced-motion: reduce` 降级。

## 3. 影响

- [ADR-0005](adr-0005-brand-tokens-and-self-hosted-fonts.md) 中“品牌实底一律白字”的规则被本 ADR **部分取代**；其历史演化记录保留。
- 首字母 fallback 按明确品牌合同保持品牌黄底 + 白字；它标记为 `aria-hidden`，相邻网站名称提供等价信息，因此不作为正文或功能控件文字。Logo 闪电同样保留白色品牌图形。
- 若未来新增弹窗、筛选器或品牌色按钮，必须复用上述语义与 token，不得重新引入白字黄底功能文本。

## 4. 验证要求

- 桌面与移动 viewport 无横向溢出，弹窗不超出可视区。
- 键盘可到达所有操作；焦点不进入模态背景控件，关闭后回到触发控件。
- 所有选择态可由 `aria-pressed` 识别；所有可见交互目标至少 `24 × 24 CSS px`。
- `npm run verify` 与浏览器 smoke 均通过。
