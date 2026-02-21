// src/modules/project/controller.ts

// 引用類型定義文件以確保類型擴展被載入
/// <reference path="../../types/express.d.ts" />

import {
  createProjectSchema,
  getProjectsQuerySchema,
  projectCodeParamSchema,
  updateProjectSchema,
} from '@/modules/project/validators/schemas';
import { NextFunction, Request, Response } from 'express';
import { projectService } from './service';

export const projectController = {
  // 取得專案列表
  async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 解析並驗證查詢參數
      const query = getProjectsQuerySchema.parse(req.query);
      // 取得專案列表
      const result = await projectService.getProjects(req.user, query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // 建立專案
  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 解析並驗證請求主體
      const body = createProjectSchema.parse(req.body);
      // 建立專案
      const project = await projectService.createProject(req.user, body);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  },

  // 取得單筆專案
  async getProjectByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 解析並驗證路由參數
      const params = projectCodeParamSchema.parse(req.params);
      // 取得專案
      const project = await projectService.getProject(req.user, params.projectCode);
      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  },

  // 更新專案
  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 解析並驗證路由參數
      const params = projectCodeParamSchema.parse(req.params);
      // 解析並驗證請求主體
      const body = updateProjectSchema.parse(req.body);
      // 更新專案
      const project = await projectService.updateProject(req.user, params.projectCode, body);
      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  },

  // 刪除專案
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 解析並驗證路由參數
      const params = projectCodeParamSchema.parse(req.params);
      // 刪除專案
      await projectService.deleteProject(req.user, params.projectCode);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },
};
