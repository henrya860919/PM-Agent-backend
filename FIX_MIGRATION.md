# 修复迁移错误

## 问题
迁移错误：`ERROR: index "projects_code_unique_when_not_deleted" does not exist`

## 已修复
已修复迁移文件 `prisma/migrations/20260214161547_init/migration.sql`，将：
```sql
DROP INDEX "projects_code_unique_when_not_deleted";
```

改为：
```sql
DROP INDEX IF EXISTS "projects_code_unique_when_not_deleted";
```

这样可以安全地删除索引，即使索引不存在也不会报错。

## 执行步骤

### 方法 1：直接运行迁移（推荐）

```bash
cd PM-Agent-backend
npm run prisma:migrate
```

如果还有问题，可以尝试：

### 方法 2：重置迁移（如果数据库可以重置）

```bash
cd PM-Agent-backend

# 重置数据库和迁移（⚠️ 会删除所有数据）
npm run prisma:migrate reset

# 或者只重置迁移历史（保留数据）
npx prisma migrate resolve --applied 20260214161547_init
npx prisma migrate resolve --applied 20260214234400_init
npx prisma migrate resolve --applied 20260214234405_add_project_code_unique_partial_index

# 然后创建新的迁移来添加 File 表
npm run prisma:migrate
```

### 方法 3：手动创建 File 表的迁移

如果上述方法都不行，可以手动创建迁移：

```bash
cd PM-Agent-backend

# 创建新的迁移（只创建，不应用）
npx prisma migrate dev --create-only --name add_file_table

# 然后编辑生成的 migration.sql 文件，添加 File 表的创建语句
# 或者直接运行（Prisma 会自动检测 schema 变化）
npm run prisma:migrate
```

## 验证

迁移成功后，运行：

```bash
npm run prisma:generate
```

然后检查数据库，确认 `files` 表已创建。
