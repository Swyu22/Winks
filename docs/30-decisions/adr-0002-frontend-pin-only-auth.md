# ADR-0002 — 前端 PIN + 后端开放 RLS（弱保护协作模型）

- **状态**：Accepted
- **日期**：2026-05-09（追溯记录）
- **作者**：（追溯整理：Claude）
- **关联**：[supabase/schema.sql](../../supabase/schema.sql)、[src/components/PinModal.jsx](../../src/components/PinModal.jsx)、[src/lib/constants.js](../../src/lib/constants.js)（`ADMIN_PIN`）、[README.md](../../README.md) "RLS 策略"

## 1. 背景

Winks.闪链 是一个**对外开放的协作书签站**：
- 部署在 GitHub Pages（前端纯静态）
- Supabase 仅一张 `links` 表，给 anon key 开放读写
- 没有用户系统，没有登录界面
- 期望任何访客都能浏览，受信任的人可以编辑/删除

需要一种「**门槛足够低、但不至于一目了然**」的保护：

- 不能要求登录（破坏开放性、增加 Supabase Auth 配置成本）
- 不能依赖 Supabase RLS（没有用户身份可绑）
- 不能依赖 Edge Functions（增加部署复杂度、增加成本）

## 2. 备选方案

### 方案 A：前端硬编码 PIN + 后端完全开放（现采用）

**做法**：
- `PinModal` 弹窗校验 4 位口令（PIN 字面量集中在 [src/lib/constants.js](../../src/lib/constants.js) 的 `ADMIN_PIN`，组件实现位于 [src/components/PinModal.jsx](../../src/components/PinModal.jsx)）
- 校验通过后才允许进入 `LinkModal` / 删除流程
- 后端 `links` 表的 RLS 对 `anon` 完全开放（`select/insert/update/delete`）

**优点**：
- 零配置、零依赖、零运维
- 浏览体验完全无门槛
- 任何受信任成员只需口口相传 PIN 即可参与编辑

**缺点**：
- PIN 出现在打包的 JS 中，**任何人 view-source 都能看到**
- 后端 RLS 完全开放，绕过前端可任意写入/删除（API 暴露在前端，任何人可拿到 anon key）
- 不抗自动化攻击（爬虫扫到 anon key + 表名后即可批量操作）

### 方案 B：Supabase Auth + RLS（per-user policies）

**优点**：
- 强保护，行级权限
- 编辑历史可追溯（`created_by`）

**缺点**：
- 强制登录破坏「开放浏览」核心体验
- 需要邮箱/OAuth 流程，配置成本高
- GitHub Pages 域和 Supabase Auth 回调跨域配置麻烦

### 方案 C：Edge Function 转发 + 服务端密钥校验

**做法**：把所有写操作放到 Supabase Edge Function 后面，函数内校验「比 PIN 强一点」的密钥。

**优点**：密钥不暴露在前端 bundle。
**缺点**：
- 需要 Function 部署 + Secrets 配置
- 增加冷启动 latency
- 项目规模 vs 工程量极不对称

### 方案 D：Cloudflare Pages Functions / Vercel API 中转

类似方案 C，部署目标改变。当前部署在 GitHub Pages，需要先迁移整个部署链路。**不在本期范围**。

## 3. 选择：方案 A

**核心权衡**：
- 项目**威胁模型不是机密泄漏**，而是"**别让陌生访客顺手改坏数据**"
- 前端 PIN 已经能阻挡 99% 的"路过的好奇心"
- 数据库本身存的是公开 URL 集合，最坏情况是**被恶意删除/重写**——可以通过 Supabase 备份恢复
- 当 PIN 失效或威胁模型升级，可逐步往方案 B / C 迁移，**没有锁定成本**

## 4. 已知风险与可接受度

| 风险 | 可接受度 | 缓解 |
|---|---|---|
| PIN 在 JS bundle 中明文 | ✅ 接受 | 文档中明确标注，不当作秘密对待 |
| anon key 暴露 | ✅ 接受（Supabase 设计如此） | 仅给 `links` 表开放最小集合 |
| 恶意批量写入 | ⚠ 部分接受 | 依赖 Supabase 默认 rate limit；必要时启用 Edge rate limiting |
| 恶意删除 | ⚠ 部分接受 | 定期 Supabase 备份；schema 中 `created_at` / `created_by` 可作为审计起点 |

## 5. 影响

### 必须遵守

1. **不要把 PIN 当成秘密**——文档、PR、Slack 提及都不视为泄漏。
2. **任何「需要管理员权限」的操作**都要走 `requestAuth({type, payload})` → `PinModal` → `executeXxx` 路径；当前包括编辑、删链接、删分类和删标签。
3. **不要在后端加 RLS 限制**而不同步改前端：当前前后端「对开放性达成共识」是前端能写就一定能写。
4. **不要在前端做"看起来比 PIN 严"的校验**（例如时长锁、错误次数锁定）：会给人「这是真安全」的错觉，反而危险。

### 升级触发条件（任一触发即考虑迁移到方案 B/C）

- 出现实际滥用事件（恶意删除/批量垃圾写入）
- 引入用户身份语义（如「我的收藏」「点赞」）
- 数据敏感度升级（出现私有链接）

## 6. 备注

- 当前 PIN 选择 `5185` 没有特殊语义，集中在 [src/lib/constants.js](../../src/lib/constants.js) 的 `ADMIN_PIN` 常量，便于 P2-1 改为 `VITE_ADMIN_PIN` 环境变量时单点替换。
- 已在 `docs/20-plan/current-iteration.md` P2-1 登记「PIN 配置化」选项，供将来评估。
