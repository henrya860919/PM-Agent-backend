#!/bin/bash

# 应用 files 表迁移脚本

set -e

echo "🔄 应用 files 表迁移..."

cd "$(dirname "$0")"

# 检查迁移文件是否存在
if [ ! -f "prisma/migrations/20260215000000_add_file_table/migration.sql" ]; then
    echo "❌ 迁移文件不存在"
    exit 1
fi

# 应用迁移
echo "📦 应用迁移到数据库..."
npx prisma migrate resolve --applied 20260215000000_add_file_table || npx prisma migrate deploy

# 或者直接执行 SQL
echo "💾 直接执行 SQL 迁移..."
psql $DATABASE_URL -f prisma/migrations/20260215000000_add_file_table/migration.sql || {
    echo "⚠️  如果 psql 命令失败，请手动运行迁移 SQL"
    echo "或者运行: npm run prisma:migrate"
}

# 重新生成 Prisma Client
echo "🔧 重新生成 Prisma Client..."
npm run prisma:generate

echo "✅ 完成！"
