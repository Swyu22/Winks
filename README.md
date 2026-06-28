# Winks.闪链

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 启动开发服务器

```bash
npm run dev
```

3. 浏览器访问 `http://127.0.0.1:4173`

当前仓库默认是 Supabase 模式（`VITE_DEMO_MODE` 未设置或为 `false`）。

## 连接 Supabase（可选）

如果你希望数据持久化，请按以下步骤：

1. 在 Supabase 项目中执行 `supabase/schema.sql` 的 SQL。
2. 复制 `.env.example` 为 `.env`，并填写 Supabase 配置：

```bash
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的AnonKey
VITE_DEMO_MODE=false
```

3. 若只想本地演示，可把 `VITE_DEMO_MODE=true`（将跳过 Supabase 请求，使用内置演示数据）。

## RLS 策略（开放读写）

`supabase/schema.sql` 当前策略如下：

1. 匿名用户（`anon`）可读取 `links`
2. 匿名用户（`anon`）可新增/更新/删除 `links`
3. 前端通过 PIN 对编辑/删除操作做交互层校验（非服务端强制）

注意：该策略适合公开协作场景，但存在被恶意写入或删除的风险。

## Supabase CLI（schema 迁移）

已接入 Supabase CLI 管理数据库 schema（macOS 用 Homebrew 安装：`brew install supabase/tap/supabase`）：

```bash
supabase login                                    # 一次性；浏览器流程或 --token
supabase link --project-ref ukwuafaoifwdkpvedvih  # 关联远端 Winks 项目（需数据库密码）
supabase db push                                  # 把 supabase/migrations/ 应用到远端
```

- 迁移文件在 `supabase/migrations/`；`supabase/schema.sql` 是同源的可读快照。
- baseline 迁移完全幂等（`CREATE/ALTER ... IF [NOT] EXISTS`），对已建好的远端 `db push` 是安全空操作，仅登记迁移历史。
- 新增 schema 改动：`supabase migration new <name>` 写 SQL → `supabase db push`，并同步更新 `schema.sql` 快照。

## 部署到 GitHub Pages

```bash
npm test
npm run build
npm run deploy
```
