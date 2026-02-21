# PostgreSQL 安裝與啟動指南

## macOS 安裝 PostgreSQL

### 方法一：使用 Homebrew（推薦）

#### 1. 安裝 PostgreSQL

```bash
# 安裝最新版本的 PostgreSQL
brew install postgresql@16

# 或安裝最新版本
brew install postgresql
```

#### 2. 啟動 PostgreSQL 服務

```bash
# 啟動 PostgreSQL 服務（開機自動啟動）
brew services start postgresql@16

# 或只啟動一次（不設定開機自動啟動）
pg_ctl -D /opt/homebrew/var/postgresql@16 start
```

#### 3. 驗證 PostgreSQL 是否運行

```bash
# 檢查服務狀態
brew services list | grep postgresql

# 或測試連線
pg_isready -h localhost -p 5433
```

#### 4. 設定初始資料庫

```bash
# 建立預設資料庫（如果需要的話）
createdb

# 或使用 psql 連線
psql postgres
```

### 方法二：使用 PostgreSQL.app（圖形界面）

1. 下載並安裝 [PostgreSQL.app](https://postgresapp.com/)
2. 開啟應用程式
3. 點擊「Initialize」初始化資料庫
4. PostgreSQL 會自動在背景運行

### 方法三：使用 Docker（適合開發環境）

```bash
# 使用 Docker 運行 PostgreSQL
docker run --name pm-agent-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pm_agent_db \
  -p 5433:5432 \
  -d postgres:16

# 檢查容器狀態
docker ps | grep postgres
```

## 常用指令

### 啟動/停止服務

```bash
# 啟動（Homebrew）
brew services start postgresql@16

# 停止
brew services stop postgresql@16

# 重啟
brew services restart postgresql@16

# 查看狀態
brew services list
```

### 連線到資料庫

```bash
# 連線到預設資料庫
psql postgres

# 連線到特定資料庫
psql -d pm_agent_db

# 使用特定使用者連線
psql -U postgres -d pm_agent_db
```

### 建立資料庫

```bash
# 建立資料庫
createdb pm_agent_db

# 或使用 SQL
psql -U postgres -c "CREATE DATABASE pm_agent_db;"
```

### 刪除資料庫

```bash
# 刪除資料庫
dropdb pm_agent_db

# 或使用 SQL
psql -U postgres -c "DROP DATABASE pm_agent_db;"
```

## 故障排除

### 問題 1：找不到 psql 指令

如果安裝後找不到 `psql`，可能需要將 PostgreSQL 的 bin 目錄加入 PATH：

```bash
# 對於 Homebrew 安裝的 PostgreSQL@16
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 或對於 Intel Mac
echo 'export PATH="/usr/local/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 問題 2：Port 5433 已被佔用

```bash
# 檢查哪個程序佔用了 5433 port
lsof -i :5433

# 停止該程序或使用其他 port
```

### 問題 3：認證失敗

檢查 PostgreSQL 的認證設定：

```bash
# 查看 pg_hba.conf 位置
psql -U postgres -c "SHOW hba_file;"

# 編輯認證設定（通常需要將 local 改為 trust 或 md5）
```

## 快速檢查清單

- [ ] PostgreSQL 已安裝
- [ ] PostgreSQL 服務正在運行
- [ ] 可以連線到資料庫（`pg_isready` 或 `psql`）
- [ ] 已建立 `pm_agent_db` 資料庫
- [ ] `.env` 檔案中的資料庫連線設定正確

## 下一步

完成 PostgreSQL 設定後，執行：

```bash
# 執行資料庫設定腳本
bash scripts/setup-db.sh

# 或手動執行 migration
npx prisma migrate deploy
```
