# File Records 功能实现说明

## 已完成的工作

### 后端 (PM-Agent-Backend)

1. **数据库 Schema**
   - 在 `prisma/schema.prisma` 中添加了 `File` 模型
   - 需要运行 `npm run prisma:migrate` 来创建数据库迁移

2. **环境变量**
   - 在 `src/_env/index.ts` 中添加了文件上传相关的环境变量配置
   - 需要在 `.env` 文件中添加以下配置：
     ```
     STORAGE_TYPE=local
     UPLOAD_MAX_FILE_SIZE=31457280
     UPLOAD_BASE_DIR=uploads
     ```

3. **File 模块**
   - `src/constants/file.ts` - 文件相关常量
   - `src/modules/file/type.ts` - 类型定义
   - `src/modules/file/validators/schemas.ts` - 验证规则
   - `src/modules/file/repository.ts` - 数据访问层
   - `src/modules/file/service.ts` - 业务逻辑层
   - `src/modules/file/controller.ts` - 控制器层

4. **Storage 模块**
   - `src/storage/` - 存储抽象层（支持 local/s3/nas）
   - `src/config/storage.config.ts` - 存储配置
   - `src/config/upload.config.ts` - 上传配置

5. **上传中间件**
   - `src/middleware/upload.ts` - 文件上传中间件（使用 busboy）

6. **工具函数**
   - `src/utils/file.ts` - 文件处理工具（hash、缩图生成等）

7. **路由**
   - `src/routes/file.routes.ts` - 文件相关路由
   - 已注册到主路由 `/api/files`

### 前端 (PM-Agent-Frontend)

1. **类型定义**
   - `src/types/file.ts` - 文件相关类型

2. **常量**
   - `src/constants/file.ts` - 文件业务类型常量

3. **API 服务**
   - `src/services/endpoints/file.ts` - 文件 API 调用

4. **工具函数**
   - `src/utils/upload.ts` - 文件上传工具函数

5. **组件**
   - `src/components/dashboard/views/FileRecords.vue` - 文件记录页面（完整实现）
   - `src/components/dashboard/steps/IntakeAnalysis.vue` - 已更新为使用真实上传 API

## 需要安装的依赖

### 后端依赖

```bash
cd PM-Agent-backend
npm install busboy sharp
npm install --save-dev @types/busboy
```

### 前端依赖

前端不需要额外安装依赖，所有需要的包已经在 `package.json` 中。

## 运行步骤

### 1. 后端设置

```bash
cd PM-Agent-backend

# 安装依赖
npm install busboy sharp @types/busboy

# 运行数据库迁移
npm run prisma:migrate

# 生成 Prisma Client
npm run prisma:generate

# 启动开发服务器
npm run dev
```

### 2. 前端设置

```bash
cd PM-Agent-frontend

# 安装依赖（如果需要）
npm install

# 启动开发服务器
npm run dev
```

## API 端点

### 上传文件
- `POST /api/files/upload`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: File (文件)
  - `businessType`: string (业务类型)
  - `businessId`: string? (业务 ID，可选)
  - `projectId`: string? (项目 ID，可选)

### 获取文件列表
- `GET /api/files?projectId={projectId}&type={type}&search={search}&page={page}&limit={limit}`
- Query 参数：
  - `projectId`: string? (项目 ID)
  - `type`: 'all' | 'audio' | 'transcript' | 'document' | 'image'
  - `search`: string? (搜索关键词)
  - `page`: number (页码)
  - `limit`: number (每页数量)

### 获取/下载文件
- `GET /api/files/{fileId}?download=true&thumbnail=true`
- Query 参数：
  - `download`: boolean (是否下载)
  - `thumbnail`: boolean (是否获取缩图)

### 删除文件
- `DELETE /api/files/{fileId}`

## 功能特性

1. **文件上传**
   - 支持多种文件类型（图片、PDF、音频、文档等）
   - 自动生成缩图（图片和 PDF）
   - 文件去重（基于 hash）
   - 进度追踪

2. **文件管理**
   - 文件列表查看
   - 按类型筛选（audio/transcript/document/image）
   - 搜索功能
   - 预览和下载

3. **存储支持**
   - Local storage（本地存储）
   - S3 storage（AWS S3，待实现）
   - NAS storage（网络存储，待实现）

## 注意事项

1. 确保 `.env` 文件配置正确
2. 确保数据库迁移已运行
3. 确保 `uploads` 目录有写入权限
4. 文件大小限制默认 30MB，可在 `.env` 中配置
