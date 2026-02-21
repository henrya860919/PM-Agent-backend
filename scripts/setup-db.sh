#!/bin/bash

# PM-Agent Backend 資料庫設定腳本

set -e

echo "🚀 開始設定 PM-Agent Backend 資料庫..."

# 檢查 PostgreSQL 命令是否存在
if ! command -v pg_isready &> /dev/null; then
    echo "❌ PostgreSQL 未安裝或不在 PATH 中"
    echo ""
    echo "請先安裝 PostgreSQL："
    echo "  brew install postgresql@16"
    echo "  brew services start postgresql@16"
    echo ""
    echo "或使用 Docker："
    echo "  docker run --name pm-agent-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pm_agent_db -p 5433:5432 -d postgres:16"
    echo ""
    exit 1
fi

# 檢查 PostgreSQL 是否運行
if ! pg_isready -h localhost -p 5433 > /dev/null 2>&1; then
    echo "❌ PostgreSQL 服務未運行在 port 5433"
    echo ""
    echo "請啟動 PostgreSQL："
    echo "  brew services start postgresql@16"
    echo ""
    echo "或檢查 .env 檔案中的 DB_PORT 設定是否正確"
    exit 1
fi

echo "✅ PostgreSQL 服務運行中"

# 讀取 .env 檔案中的資料庫設定
if [ -f .env ]; then
    source .env
    DB_NAME=${DB_NAME:-pm_agent_db}
    DB_USER=${DB_USER:-postgres}
else
    echo "⚠️  找不到 .env 檔案，使用預設值"
    DB_NAME=pm_agent_db
    DB_USER=postgres
fi

echo "📦 資料庫名稱: $DB_NAME"
echo "👤 資料庫使用者: $DB_USER"

# 讀取 port（從 .env 或使用預設值）
if [ -f .env ]; then
    source .env
    DB_PORT=${DB_PORT:-5433}
else
    DB_PORT=5433
fi

# 檢查資料庫是否存在（使用正確的 port）
if PGPORT=$DB_PORT psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "ℹ️  資料庫 $DB_NAME 已存在"
else
    echo "📝 建立資料庫 $DB_NAME..."
    PGPORT=$DB_PORT createdb -U "$DB_USER" "$DB_NAME" || PGPORT=$DB_PORT psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
    echo "✅ 資料庫建立成功"
fi

# 執行 migration
echo "🔄 執行 Prisma Migration..."
npx prisma migrate deploy

echo "✅ 資料庫設定完成！"
echo ""
echo "📝 下一步："
echo "   1. 確認 .env 檔案中的資料庫連線設定正確"
echo "   2. 執行 'npm run dev' 啟動開發伺服器"
