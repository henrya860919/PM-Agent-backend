-- 建立部分唯一索引：只在 deleted_at IS NULL 時生效
-- 這確保未刪除的專案代碼是唯一的
-- PostgreSQL 的 UNIQUE INDEX 對 NULL 會放行多筆，因此不能用 (code, deleted_at) 來表達此語意
CREATE UNIQUE INDEX IF NOT EXISTS "projects_code_unique_when_not_deleted"
ON "projects"("code")
WHERE "deleted_at" IS NULL;
