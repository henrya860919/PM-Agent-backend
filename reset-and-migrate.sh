#!/bin/bash

# 重置数据库并重新运行所有迁移

set -e

echo "🔄 重置数据库并重新运行迁移..."
echo "⚠️  警告：这将删除所有数据！"
echo ""
read -p "确定要继续吗？(y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消"
    exit 1
fi

echo ""
echo "🗑️  步骤 1: 重置数据库..."
npx prisma migrate reset --force

echo ""
echo "📦 步骤 2: 生成 Prisma Client..."
npm run prisma:generate

echo ""
echo "✅ 完成！数据库已重置并应用所有迁移"
echo ""
echo "📝 下一步："
echo "1. 运行 'npm run dev' 启动后端服务"
echo "2. 如果需要种子数据，运行 'npm run prisma:seed'"
