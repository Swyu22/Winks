# ADR-0005 — 品牌色 token 化 + 自托管字体

- **状态**：Accepted
- **日期**：2026-06-26
- **作者**：Claude（Opus 4.8）
- **关联**：[src/index.css](../../src/index.css)、[tailwind.config.js](../../tailwind.config.js)、[src/main.jsx](../../src/main.jsx)、WithMedia.与众 品牌色 + 字体规范

## 1. 背景

此前全站强调色直接用 Tailwind 默认 `yellow-*`（`#facc15`），且多处 `bg-yellow-400 text-white`（白字黄底，WCAG 对比度不足，登记为 P2-4）。字体用系统默认。需要落地 WithMedia 品牌规范：品牌黄 `#FFD000`、黑配黄、三套指定字体且**自托管脱离 Google CDN**。

## 2. 决策

### 2.1 颜色 = CSS 变量 token（单一事实源）

在 [src/index.css](../../src/index.css) 的 `:root` 定义品牌色阶（`--brand-50…700`，`#FFFBEB…#A87E00`）、`--brand`=`--brand-400`=`#FFD000`、`--brand-foreground`=`#09090B`、`--brand-muted`=`--brand-100`，并加一个规范外的可达性 token `--brand-text`=`#8A6800`（见 §3）。[tailwind.config.js](../../tailwind.config.js) 的 `theme.extend.colors.brand` 用 `var(--brand-*)` 引用，启用 `bg-brand` / `text-brand` / `border-brand-200` 等类。

> 规范写的是 `globals.css`；本项目的全局样式入口是 `index.css`，故 token 落在 index.css。

**强制规则（2026-06-26 经用户指令更新为「白配黄」）**：品牌实底 `#FFD000`（`bg-brand`：按钮、激活态、Logo 圆点、首字母块）**里面一律配白色图形/文字**（`text-white` / `fill-white`），不出现黄黑配色。

> 演化记录：本 ADR 初版（同日早些）按用户给的品牌规范文档落地的是「黑配黄」（`bg-brand text-brand-foreground`，≈13.5:1，曾顺带解决 P2-4）。随后用户明确改为「白配黄」，遂全量反转为 `bg-brand text-white`。
> ⚠ **可读性权衡**：白字/品牌黄（#FFFFFF on #FFD000）对比度很低（≈1.1:1，不过 WCAG）。这是用户有意的品牌外观选型（与站点原始风格一致），已知会让黄底文字偏难读；如需兼顾可读性可后续评估描边/加深黄。
> `--brand-foreground`（近黑）保留，仅用于**浅黄底 `brand-200` 的选区高亮**（白字在浅黄上不可读，故选区维持深字这一可读例外）。

### 2.2 字体 = @fontsource 可变字体自托管

用 `@fontsource-variable/{space-grotesk,noto-sans-sc,jetbrains-mono}`，在 [src/main.jsx](../../src/main.jsx) 导入各自 `/wght.css`。完全脱离 Google CDN、随构建打包到自有域名。中文 Noto 按 `unicode-range` 拆分为按需子集（只下可见字的子集）。字体栈 `--font-sans/display/mono` 把 fontsource 注册名（`"… Variable"`）置于栈首，再回退系统 PingFang/微软雅黑。Tailwind `fontFamily.sans/display/mono` 引用之。

## 3. 关键约束 / 影响

1. **hex CSS 变量不支持 Tailwind 的 `/opacity` 修饰**（`bg-brand/50`、`shadow-brand/20` 会静默失效）。需要带透明度的彩色阴影一律用字面 `rgba(255,208,0,…)`，**不要**用 `brand/<alpha>`。
2. **`--brand-text`（#8A6800）专供白底上的金色文字**（强调/hover 态），过 WCAG AA（≈4.7:1）；品牌黄 `brand-400/500/600` 在白底做正文文字对比度不足，**禁止**用 `text-brand-400/500/600` 当白底文字（fill/底色仍用品牌黄）。图形图标最低 `brand-700`（≈3.34:1 过 3:1）。
3. **mono 栈无 CJK**：`font-mono` 只用于纯数字/编号/日期（版本号、年份），不要套在含中文的元素上（中文会回退系统字体）。
4. **静态资源不读 CSS 变量**：[public/favicon.svg](../../public/favicon.svg) 用字面 `#FFD000` + `#09090B`（黑配黄），改品牌色时需手动同步。
5. 自托管 CJK 的代价：CSS 体积上升（大量 `@font-face` unicode-range 规则，约 +47KB gz），但实际 woff2 按需下载。可接受。

## 4. 备选（未采纳）

- **继续用 Tailwind `yellow-*`**：非品牌色（#facc15≠#FFD000），且白字黄底对比度问题无解。
- **Google Fonts CDN**：违反「自托管脱离 Google CDN」要求；CN 可达性差。
- **手动 vendored woff2**：拉丁可行，但 CJK 需手动子集化/几 MB 整包，远比 @fontsource 的 unicode-range 方案差。
