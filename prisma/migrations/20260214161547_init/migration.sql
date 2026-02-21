-- DropIndex (使用 IF EXISTS 避免在 shadow database 中出错)
DROP INDEX IF EXISTS "projects_code_unique_when_not_deleted";
