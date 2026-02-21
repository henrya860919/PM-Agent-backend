// src/routes/index.ts
import { Express, Router } from 'express';
import fileRoutes from './file.routes';
import projectRoutes from './project.routes';
import devRoutes from './dev.routes';

export const registerRoutes = (app: Express): void => {
  // ========== 系統路由（不加前綴）==========
  // 健康檢查路由
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'PM-Agent Backend is running' });
  });

  // ========== API 路由（統一 /api 前綴）==========
  const apiRouter = Router();
  apiRouter.use('/projects', projectRoutes);
  apiRouter.use('/files', fileRoutes);

  if (process.env.NODE_ENV === 'development') {
    apiRouter.use('/dev', devRoutes);
  }

  app.use('/api', apiRouter);
};
