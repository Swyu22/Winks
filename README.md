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

当前仓库默认是 Supabase 模式（`src/App.jsx` 中 `USE_DEMO_MODE = false`）。

## 连接 Supabase（可选）

如果你希望数据持久化，请按以下步骤：

1. 在 Supabase 项目中执行 `Supabase/schema.sql` 的 SQL。
2. 在项目根目录创建 `.env`：

```bash
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的AnonKey
```

3. 打开 `src/App.jsx`，把 `USE_DEMO_MODE` 改为 `false`。

## RLS 策略（开放读写）

`Supabase/schema.sql` 当前策略如下：

1. 匿名用户（`anon`）可读取 `links`
2. 匿名用户（`anon`）可新增/更新/删除 `links`
3. 前端通过 PIN 对编辑/删除操作做交互层校验（非服务端强制）

注意：该策略适合公开协作场景，但存在被恶意写入或删除的风险。

## 部署到 GitHub Pages

```bash
npm run build
npm run deploy
```
