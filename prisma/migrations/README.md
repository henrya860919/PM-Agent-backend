# Prisma Migrations

## 第一次建立 Migration

執行以下指令來建立初始 migration：

```bash
npx prisma migrate dev --name init
```

## 建立專案代碼唯一性約束

由於 Prisma 的 `@@unique` 無法正確處理 soft delete 的唯一性（PostgreSQL 對 NULL 會允許多筆），需要在 migration 中手動建立 partial unique index。

在第一次 migration 後，建立一個新的 migration：

```bash
npx prisma migrate dev --name add_project_code_unique_partial_index --create-only
```

然後編輯 `prisma/migrations/[timestamp]_add_project_code_unique_partial_index/migration.sql`，加入以下 SQL：

```sql
-- 建立部分唯一索引：只在 deleted_at IS NULL 時生效
-- 這確保未刪除的專案代碼是唯一的
CREATE UNIQUE INDEX IF NOT EXISTS "projects_code_unique_when_not_deleted"
ON "projects"("code")
WHERE "deleted_at" IS NULL;
```

最後執行：

```bash
npx prisma migrate dev
```

## 參考

這個做法參考自 `noblehall-cms-backend` 的實作：
- `prisma/migrations/20260121134137_project_code_unique_partial_index/migration.sql`
