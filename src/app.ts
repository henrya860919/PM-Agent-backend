// 引用類型定義文件以確保類型擴展被載入
/// <reference path="./types/express.d.ts" />

import { errorHandler, requireAuthenticated } from '@/middleware';
import { registerRoutes } from '@/routes';
import { corsConfig } from '@/config';
import express from 'express';

const app = express();

// Middleware
// 🌐 CORS 配置
app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 認證中間件（暫時的簡化版本）
app.use(requireAuthenticated);

// 註冊路由
registerRoutes(app);

// Error handler (should be last)
app.use(errorHandler);

export default app;
