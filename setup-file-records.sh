#!/bin/bash

# File Records 功能设置脚本

set -e

echo "🚀 开始设置 File Records 功能..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在 PM-Agent-backend 目录下运行此脚本"
    exit 1
fi

# 1. 安装依赖
echo ""
echo "📦 步骤 1: 检查依赖..."
if npm list busboy sharp @types/busboy > /dev/null 2>&1; then
    echo "✅ 依赖已安装"
else
    echo "📥 安装依赖..."
    npm install busboy sharp @types/busboy
fi

# 2. 创建上传目录
echo ""
echo "📁 步骤 2: 创建上传目录..."
mkdir -p uploads/temp
echo "✅ 上传目录已创建"

# 3. 检查 .env 文件
echo ""
echo "⚙️  步骤 3: 检查环境变量配置..."
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件"
    if [ -f ".env.example" ]; then
        echo "📋 从 .env.example 创建 .env 文件..."
        cp .env.example .env
        echo "✅ .env 文件已创建，请检查并更新配置"
    else
        echo "📝 创建 .env 文件..."
        cat > .env << EOF
# PM-Agent Backend Environment Variables
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pm_agent_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pm_agent_db

# CORS
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_HEADERS=Content-Type,Authorization,x-user-id

# File Upload
STORAGE_TYPE=local
UPLOAD_MAX_FILE_SIZE=52428800
UPLOAD_BASE_DIR=uploads
EOF
        echo "✅ .env 文件已创建，请检查并更新配置"
    fi
else
    echo "✅ .env 文件已存在"
    # 检查必要的配置
    if ! grep -q "STORAGE_TYPE" .env; then
        echo "⚠️  添加文件上传配置到 .env..."
        cat >> .env << EOF

# File Upload
STORAGE_TYPE=local
UPLOAD_MAX_FILE_SIZE=52428800
UPLOAD_BASE_DIR=uploads
EOF
        echo "✅ 文件上传配置已添加"
    fi
fi

# 4. 运行数据库迁移
echo ""
echo "🗄️  步骤 4: 运行数据库迁移..."
echo "⚠️  这将创建 File 表的迁移，请确保数据库已启动"
read -p "是否继续？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run prisma:migrate
    npm run prisma:generate
    echo "✅ 数据库迁移完成"
else
    echo "⏭️  跳过数据库迁移，请稍后手动运行: npm run prisma:migrate"
fi

echo ""
echo "✅ 设置完成！"
echo ""
echo "📝 下一步："
echo "1. 检查 .env 文件中的数据库配置"
echo "2. 运行 'npm run dev' 启动后端服务"
echo "3. 在前端应用中测试文件上传功能"
