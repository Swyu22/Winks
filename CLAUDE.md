# CLAUDE.md — Winks.闪链 项目总纲

> 本文件被 Claude 自动加载为上下文，是跨设备/跨模型协作的「入口」。
> **它不重复代码能告诉你的事**，只描述代码以外的约定、约束、协作规则。

---

## 1. 项目一句话

Winks.闪链 —— 开放协作式书签导航站（React + Vite + Supabase + Tailwind），支持 Demo 离线模式与 GitHub Pages 静态部署。

## 2. 技术栈与版本

| 类别 | 选型 | 版本 |
|---|---|---|
| 框架 | React | 18.2 |
| 构建 | Vite | 5.x |
| 样式 | Tailwind CSS | 3.3 |
| 后端 | Supabase（仅 `links` 表） | `@supabase/supabase-js` ^2.39 |
| 图标 | lucide-react | ^0.294 |
| 部署 | GitHub Pages（`gh-pages`） | — |
| Lint | ESLint + react / react-hooks / react-refresh | ^8.55 |

## 3. 目录约定

```
.
├── CLAUDE.md                    # 本文件——项目总纲，跨会话入口
├── .cloud.md                    # 当前状态快照（活跃模块/未决项/下一步）
├── README.md                    # 面向人类的快速上手
├── ai/
│   └── sessions/                # 每次会话的工作记录（YYYY-MM-DD.md）
├── docs/
│   ├── 00-context/              # 不变事实：架构图、模块边界、术语
│   ├── 10-spec/                 # 接口/数据模型规范（合同）
│   ├── 20-plan/                 # 当前迭代 checklist
│   └── 30-decisions/            # ADR：架构决策记录（adr-NNNN-slug.md）
├── scripts/
│   └── git-hooks/               # 仓库级 git hook（通过 core.hooksPath 注册）
├── src/
│   ├── App.jsx                  # 页面编排入口（≤ 200 行）
│   ├── components/              # 纯 UI 组件
│   ├── hooks/
│   │   └── useLinks.js          # 链接状态、筛选、Supabase CRUD 编排
│   ├── main.jsx                 # React 入口
│   ├── index.css                # Tailwind 入口
│   └── lib/
│       ├── constants.js         # 默认集合、版本、运行模式、ADMIN_PIN、ALL_FILTER、PIN_ACTIONS
│       ├── linkMeta.js          # links.category meta 编码/解码/归一化
│       ├── linkActions.js       # 纯函数 action helpers（删 tag/分类、保存归一化）
│       └── supabaseClient.js    # Supabase 客户端懒加载
├── Supabase/
│   └── schema.sql               # `links` 表 + RLS 策略
└── public/                      # 静态资源
```

## 4. 跨会话协作规则（⚠ 强制）

> 文件系统是**唯一可靠状态源（SSOT）**，不依赖会话记忆。

1. **接手任何任务前**，必须先读：`CLAUDE.md` → `.cloud.md` → 模块 README →（涉及架构时）`docs/00-context/PROJECT_MAP.md` + 相关 spec/ADR。
2. **改完代码必须回写文档**：
   - 模块职责/依赖/输出变化 → 关键文件头注释 + 模块 README
   - 架构/模块边界变化 → `docs/00-context/PROJECT_MAP.md`
   - 数据模型/接口变化 → `docs/10-spec/*`
   - 关键决策 → 新增 `docs/30-decisions/adr-NNNN-*.md`
   - 进度 → `docs/20-plan/current-iteration.md`
   - 当前快照 → `.cloud.md`
   - 本次会话总结 → `ai/sessions/YYYY-MM-DD.md`
3. **渐进式上下文加载**：按任务复杂度决定读取范围，禁止默认全量灌入。
4. **Hook / 自动检查 优先于 prompt 口头约束**；hook 失败不得 `--no-verify` 绕过。

## 5. 质量红线（默认）

| 项 | 上限 |
|---|---|
| 单文件 | ≤ 800 行 |
| 单函数 | ≤ 30 行 |
| 嵌套层级 | ≤ 3 层 |
| 单函数分支数 | ≤ 3 |

> 当前 P0 拆分已完成，[src/App.jsx](src/App.jsx) 收敛到页面编排；剩余长函数集中在 [src/hooks/useLinks.js](src/hooks/useLinks.js)，已登记为 P1。

## 6. 关键约束（容易被破坏的隐性合同）

1. **`category` 字段双重身份**：Supabase `links.category` 既是「分类」字段，又承载 `__WINKS_META__{json}` 编码的 `{classification, tags, board}` 三元组。详见 [docs/10-spec/data-model.md](docs/10-spec/data-model.md) 与 [adr-0001](docs/30-decisions/adr-0001-meta-encoding-in-category.md)。
2. **`DEFAULT_BOARDS` 是硬编码**（`['网站', '页面']`），位置在 [src/lib/constants.js](src/lib/constants.js)，增删 board 需要前后端同步。
3. **PIN `5185` 硬编码在前端常量**（[src/lib/constants.js](src/lib/constants.js)，由 [src/components/PinModal.jsx](src/components/PinModal.jsx) 使用），后端 RLS 完全开放——这是「协作式弱保护」选型，详见 [adr-0002](docs/30-decisions/adr-0002-frontend-pin-only-auth.md)。
4. **`hydrateLink` 必须在所有读路径调用一次**（fetch / insert.select / update.select），实现位于 [src/lib/linkMeta.js](src/lib/linkMeta.js)，用以兼容 legacy 数据。
5. **Vite `base: './'`**——便于 GitHub Pages 子路径，禁止改成绝对路径。

## 7. 常用命令

```bash
npm install        # 安装依赖（git hooks 不会自动注册，需手动执行一次，见 §8）
npm run dev        # 启动开发服务器（127.0.0.1:4173）
npm test           # Node 内置测试，当前覆盖 linkMeta 纯函数
npm run lint       # ESLint
npm run build      # 生产构建
npm run preview    # 预览构建产物
npm run deploy     # 部署到 GitHub Pages
```

## 8. Git Hook（仓库级）

通过 `core.hooksPath = scripts/git-hooks` 注册。**首次克隆后必须执行**：

```bash
git config core.hooksPath scripts/git-hooks
```

> 注意：worktree 不会自动继承此配置，新建 worktree 后需要在主仓库重新设置（或在 worktree 内单独设置）。

当前已注册 hook：

| Hook | 行为 | 失败处理 |
|---|---|---|
| `pre-commit` | staged JS/JSX/CJS/MJS 变更时运行 `npm run lint` | 修复 lint 错误，**不要** `--no-verify` 绕过 |

## 9. 环境变量

| 变量 | 用途 | 必填 |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | Supabase 模式必填 |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key | Supabase 模式必填 |
| `VITE_DEMO_MODE` | `true` 时使用内置演示数据，跳过 Supabase | 选填，默认 `false` |

## 10. 给 Claude 的工作偏好

- 改前先读、读完再说计划、计划确认后再动代码。
- 输出语言中文，代码注释克制（详见根目录系统提示）。
- 不擅自添加新依赖；如需添加，先在会话中提案并说明替代方案。
- 不擅自修改 git config / 运行破坏性 git 命令。
- 单 PR 单主题；文档与代码同 PR 提交。
