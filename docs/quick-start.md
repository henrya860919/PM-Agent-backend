# 快速開始指南

## 步驟 1：安裝 PostgreSQL

### 方法 A：使用 Homebrew（推薦）

```bash
# 安裝 PostgreSQL
brew install postgresql@16

# 啟動 PostgreSQL 服務
brew services start postgresql@16

# 將 PostgreSQL 加入 PATH（如果需要的話）
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 驗證安裝
pg_isready -h localhost -p 5432
```

**注意**：如果你要使用 port 5433，需要修改 PostgreSQL 設定檔：

```bash
# 找到 postgresql.conf
psql -U postgres -c "SHOW config_file;"

# 編輯設定檔，修改 port = 5433
# 然後重啟服務
brew services restart postgresql@16
```

### 方法 B：使用 Docker（更簡單，推薦用於開發）

```bash
# 啟動 PostgreSQL 容器（自動映射到 port 5433）
docker run --name pm-agent-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pm_agent_db \
  -p 5433:5432 \
  -d postgres:16

# 檢查容器狀態
docker ps | grep postgres

# 如果需要停止
docker stop pm-agent-postgres

# 如果需要啟動已存在的容器
docker start pm-agent-postgres
```

### 方法 C：使用 PostgreSQL.app

1. 下載並安裝 [PostgreSQL.app](https://postgresapp.com/)
2. 開啟應用程式
3. 點擊「Initialize」初始化資料庫
4. 在設定中修改 port 為 5433（如果需要）

## 步驟 2：設定環境變數

確認 `.env` 檔案中的資料庫連線設定：

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pm_agent_db
DB_PORT=5433
```

**注意**：請根據你的實際設定調整：
- `postgres:postgres` → `使用者名稱:密碼`
- `5433` → 你的 PostgreSQL port

## 步驟 3：建立資料庫並執行 Migration

```bash
# 執行自動化腳本
bash scripts/setup-db.sh

# 或手動執行
createdb -p 5433 pm_agent_db
npx prisma migrate deploy
```

## 步驟 4：建立測試資料（可選）

```bash
npm run prisma:seed
```

## 步驟 5：啟動開發伺服器

```bash
npm run dev
```

## 故障排除

### 問題：找不到 pg_isready 或 psql

**解決方案**：將 PostgreSQL 加入 PATH

```bash
# 對於 Apple Silicon Mac
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 對於 Intel Mac
echo 'export PATH="/usr/local/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 問題：認證失敗

檢查 `.env` 檔案中的資料庫密碼是否正確。

### 問題：Port 已被佔用

```bash
# 檢查 port 5433 是否被佔用
lsof -i :5433

# 或使用其他 port，記得更新 .env 檔案
```
