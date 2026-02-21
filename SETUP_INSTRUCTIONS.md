# File Records 功能设置说明

## ✅ 已完成的工作

所有代码已经实现完成，包括：
- 后端 File 模块（controller, service, repository, validators）
- 前端 FileRecords 页面和上传功能
- Storage 抽象层
- 上传中间件

## 📦 依赖检查

依赖已经在 `package.json` 中：
- ✅ `busboy` - 文件上传处理
- ✅ `sharp` - 图片处理
- ✅ `@types/busboy` - TypeScript 类型定义

## 🔧 需要执行的步骤

### 1. 安装依赖（如果还没有安装）

```bash
cd PM-Agent-backend
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（如果还没有），参考 `.env.example`：

```bash
cd PM-Agent-backend
cp .env.example .env  # 如果 .env 不存在
```

确保 `.env` 文件中包含以下配置：

```env
# 文件上传配置
STORAGE_TYPE=local
UPLOAD_MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_BASE_DIR=uploads
```

### 3. 运行数据库迁移

```bash
cd PM-Agent-backend

# 创建迁移
npm run prisma:migrate

# 生成 Prisma Client
npm run prisma:generate
```

### 4. 创建上传目录

```bash
cd PM-Agent-backend
mkdir -p uploads/temp
```

### 5. 启动服务

**后端：**
```bash
cd PM-Agent-backend
npm run dev
```

**前端：**
```bash
cd PM-Agent-frontend
npm run dev
```

## 🎯 功能测试

1. 打开前端应用（通常是 http://localhost:5173）
2. 进入 PM Dashboard
3. 在 Intake & Analysis 步骤中上传文件
4. 切换到 File Records 视图查看上传的文件

## 📝 API 端点

- `POST /api/files/upload` - 上传文件
- `GET /api/files` - 获取文件列表
- `GET /api/files/:fileId` - 获取/下载文件
- `DELETE /api/files/:fileId` - 删除文件

## ⚠️ 注意事项

1. 确保数据库已启动并连接正常
2. 确保 `uploads` 目录有写入权限
3. 文件大小限制默认 50MB，可在 `.env` 中调整
4. 支持的文件类型在 `src/config/upload.config.ts` 中配置
