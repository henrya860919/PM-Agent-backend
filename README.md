# PM-Agent Backend

Express.js + TypeScript + Prisma + PostgreSQL 後端系統

## 技術棧

- Node.js >= 22.20.0
- TypeScript 5.8.3
- Express 5.1.0
- PostgreSQL 16
- Prisma 7.2.0
- Zod（驗證）

## 快速開始

### 0. 安裝 PostgreSQL（如果還沒有安裝）

**方法 A：使用 Homebrew（推薦）**

```bash
# 安裝 PostgreSQL
brew install postgresql@16

# 啟動 PostgreSQL 服務
brew services start postgresql@16

# 將 PostgreSQL 加入 PATH（如果找不到命令）
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 驗證是否運行
pg_isready -h localhost -p 5432
```

**方法 B：使用 Docker（更簡單，推薦用於開發）**

```bash
# 啟動 PostgreSQL 容器（自動映射到 port 5433）
docker run --name pm-agent-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pm_agent_db \
  -p 5433:5432 \
  -d postgres:16
```

**方法 C：使用 PostgreSQL.app**

下載並安裝 [PostgreSQL.app](https://postgresapp.com/)，開啟後點擊「Initialize」

**詳細說明請參考：**
- [docs/setup-postgresql.md](./docs/setup-postgresql.md) - 完整安裝指南
- [docs/quick-start.md](./docs/quick-start.md) - 快速開始指南

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 並建立 `.env` 檔案：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，設定資料庫連線資訊。

### 3. 建立資料庫並執行 Migration

**方式一：使用自動化腳本（推薦）**

```bash
# 執行資料庫設定腳本（會自動建立資料庫並執行 migration）
bash scripts/setup-db.sh
```

**方式二：手動執行**

確保 PostgreSQL 已啟動，然後建立資料庫：

```bash
# 使用 psql 建立資料庫
createdb pm_agent_db

# 或使用 SQL
psql -U postgres -c "CREATE DATABASE pm_agent_db;"
```

### 4. 執行 Prisma Migration

Migration 檔案已經建立完成，包含：
- `20260214234400_init` - 初始資料表結構
- `20260214234405_add_project_code_unique_partial_index` - 專案代碼唯一性約束（partial unique index）

執行以下指令來套用 migration：

```bash
# 產生 Prisma Client（已完成）
npm run prisma:generate

# 套用 migration 到資料庫
npx prisma migrate deploy
```

或者使用開發模式（會自動套用並記錄）：

```bash
npx prisma migrate dev
```

### 5. 建立測試資料（可選）

在開發環境下，可以執行 seed 腳本來建立測試使用者：

```bash
npm run prisma:seed
```

這會建立一個預設的測試使用者（UUID: `00000000-0000-0000-0000-000000000001`）。

### 6. 啟動開發伺服器

```bash
npm run dev
```

伺服器會在 `http://localhost:3000` 啟動。

## 專案結構

```
src/
├── _env/          # 環境變數與型別
├── constants/     # 領域常數
├── lib/           # Prisma 等共用庫
├── middleware/    # Express 中間件
├── modules/       # 功能模組（controller → service → repository）
├── routes/        # API 路由
├── shared/        # 共用程式碼、型別、validators、utils
├── app.ts
└── server.ts
```

## API 路由

### 專案相關

- `POST /api/projects` - 建立專案
- `GET /api/projects` - 取得專案列表
- `GET /api/projects/:projectCode` - 取得單一專案
- `PUT /api/projects/:projectCode` - 更新專案
- `DELETE /api/projects/:projectCode` - 刪除專案

### 開發測試

**開發環境自動認證：**

在開發環境（`NODE_ENV=development`）下，認證中間件會自動使用預設測試使用者，**不需要**提供 `x-user-id` header。

如果沒有執行 seed，系統會自動使用預設使用者 UUID：`00000000-0000-0000-0000-000000000001`

**建立專案範例（不需要提供 ownerId，會自動使用當前使用者）：**

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試專案",
    "code": "test-001",
    "description": "這是一個測試專案"
  }'
```

**如果需要指定不同的使用者，可以透過 header：**

```bash
curl -H "x-user-id: your-user-uuid" http://localhost:3000/api/projects
```

## Prisma 指令

```bash
# 產生 Prisma Client
npm run prisma:generate

# 建立並執行 migration
npm run prisma:migrate

# 開啟 Prisma Studio（資料庫視覺化工具）
npm run prisma:studio

# 格式化 schema
npm run prisma:format

# 執行 seed（建立測試資料）
npm run prisma:seed
```

## 開發規範

本專案參考 `noblehall-cms-backend` 的架構與規範：

- **分層架構**：Controller → Service → Repository
- **驗證**：使用 Zod 進行輸入驗證
- **錯誤處理**：統一的錯誤類型與處理
- **Soft Delete**：使用 `deletedAt` 欄位進行軟刪除
- **唯一性約束**：使用 Partial Unique Index 處理 soft delete 的唯一性

## 待實作功能

- [ ] 完整的認證系統（目前使用簡化版本）
- [ ] 權限管理（RBAC）
- [ ] 多租戶支援（Space）
- [ ] 專案成員管理
- [ ] 其他業務功能
