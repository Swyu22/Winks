# 卡片一句话简介与复制按钮实施计划

> **For Codex:** 使用 `test-driven-development`、`supabase`、`accessibility`、`frontend-design`、`commit` 与 `verification-before-completion` Skills 逐项实施和验收。

**目标：** 为链接增加可选的一句话简介，回填现有 36 条数据，并将卡片复制操作改为左下角 `28px × 28px` 的可访问纯图标按钮。

**架构：** 在 `public.links` 新增独立可空 `description` 列，由 `linkMeta` 负责读取归一化，`linkActions` 负责写入归一化。React 组件仅消费归一化后的字段，缓存键升级以隔离旧数据形状。

**技术栈：** React 18、Vite 5、Tailwind CSS 3、Supabase PostgreSQL、Node test runner、ESLint、Playwright/浏览器验收。

---

## Task 1：建立失败测试

**文件：**

- 修改：`src/lib/linkMeta.test.js`
- 修改：`src/lib/linkActions.test.js`
- 修改：`src/lib/linksCache.test.js`

1. 为简介归一化增加测试：去除首尾空白、空值转空字符串、按 15 个 Unicode 字符限制长度。
2. 为 `hydrateLink` 增加 `null` 与缺失简介兼容测试。
3. 为保存载荷增加“有值写字符串、空值写 `null`”测试。
4. 断言缓存版本为 `winks:links:v2`。
5. 运行相关测试，确认因实现尚不存在而按预期失败。

预期核心合同：

```js
assert.equal(normalizeDescription('  AI图像工具  '), 'AI图像工具')
assert.equal(normalizeDescription(null), '')
assert.equal(normalizeSaveLinkData({ description: '   ' }).dbPayload.description, null)
```

## Task 2：增加数据库迁移与快照

**文件：**

- 新增：`supabase/migrations/<timestamp>_add_link_descriptions.sql`
- 修改：`supabase/schema.sql`

1. 使用 `supabase migration new add_link_descriptions` 生成迁移文件。
2. 新增可空 `description text` 列。
3. 按 UUID 回填设计文档列出的 36 条简介。
4. 添加 `links_description_check`，约束非空值已 trim 且长度为 1 至 15。
5. 同步 schema 快照并以 SQL 静态检查、字符长度脚本和本地测试验收。

约束形态：

```sql
check (
  description is null
  or (
    description = btrim(description)
    and char_length(description) between 1 and 15
  )
)
```

## Task 3：实现前端数据合同

**文件：**

- 修改：`src/lib/linkMeta.js`
- 修改：`src/lib/linkActions.js`
- 修改：`src/lib/constants.js`
- 按实际位置修改：演示数据文件

1. 实现并导出 `normalizeDescription`。
2. 在 `hydrateLink` 中始终返回字符串简介。
3. 在保存载荷中写入 trim 后的简介，空值转换为 `null`。
4. 将缓存键升级为 `winks:links:v2`。
5. 若项目包含内置演示链接，为演示记录补充相同风格的简介。
6. 重新运行 Task 1 测试，确认全部转绿。

## Task 4：实现表单与卡片界面

**文件：**

- 修改：`src/components/LinkModal.jsx`
- 修改：`src/components/LinkCard.jsx`

1. 在表单状态中加入 `description`，编辑时回显，新增时默认为空。
2. 添加可选文本输入，`maxLength={15}`，不引入必填校验。
3. 在卡片标题与标签之间渲染 `text-sm` 单行简介，并用固定最小高度保留空行。
4. 将复制按钮改为 `size-7` 纯图标按钮，复制成功后显示 `Check` 图标。
5. 保留动态辅助名称、悬浮提示、焦点可见性和状态播报。

目标结构：

```jsx
<p className="mt-1 min-h-5 truncate text-sm">{link.description}</p>
<button className="absolute bottom-4 left-6 size-7" aria-label={copyLabel}>
  {copied ? <Check /> : <Copy />}
</button>
```

## Task 5：同步项目文档

**文件：**

- 修改：`src/README.md`
- 修改：`docs/00-context/PROJECT_MAP.md`
- 修改：`docs/10-spec/data-model.md`
- 修改：`docs/20-plan/current-iteration.md`
- 新增：`docs/30-decisions/adr-0007-link-description-column.md`
- 修改：`.cloud.md`
- 新增或修改：`ai/sessions/2026-07-13.md`

1. 记录 `description` 类型、读写归一化和数据库约束。
2. 记录独立列而非 `category` 元数据的决策。
3. 更新迭代进度、当前状态和会话变更。
4. 检查文档中的版本、路径、命令和实际实现一致。

## Task 6：本地全量验收与提交

1. 运行 `npm test`。
2. 运行 `npm run lint`。
3. 运行 `npm run build`。
4. 运行 `npm run check:deploy-env`，使用安全注入的生产变量验证。
5. 启动本地预览，在桌面和移动视口核对布局、空简介行与按钮尺寸。
6. 检查 `git diff --check`、迁移字符长度和工作树变更边界。
7. 提交并推送 `main`，不得绕过仓库 hook。

## Task 7：应用迁移并部署生产

1. 使用 Supabase 迁移能力将本轮迁移应用到已链接项目。
2. 查询确认列、约束、36 条回填、空值数和最大长度。
3. 仅在数据库验证通过后执行 `npm run deploy`。
4. 打开生产页面，核对最新静态资源、卡片描述和纯图标复制按钮。
5. 检查桌面与移动视口、网络请求、控制台错误和复制交互。
6. 将生产验收结果回写 `.cloud.md` 与会话记录；如产生文档补记，提交并推送。

## 完成判定

- 数据库、源码、文档、远端 `main` 与 GitHub Pages 生产站一致。
- 所有自动检查通过，每项改动均有可追溯验收证据。
- 无法自动确认的内容明确列为人工确认项，不以推测代替验证。
