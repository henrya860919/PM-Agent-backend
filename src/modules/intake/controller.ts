// src/modules/intake/controller.ts
// Intake API 控制器：列表、詳情（規格 IA-1、IA-2）

import { intakeService } from '@/modules/intake/service';
import { getIntakesQuerySchema, intakeIdParamSchema } from '@/modules/intake/validators/schemas';
import type { Request, Response, NextFunction } from 'express';

export const intakeController = {
  /** GET /intakes - 列表（分頁、篩選） */
  async getIntakes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getIntakesQuerySchema.parse(req.query);
      const currentUserId = req.user?.id ?? '';
      const result = await intakeService.getIntakes(currentUserId ?? '', query);
      res.status(200).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },

  /** GET /intakes/:intakeId - 詳情 */
  async getIntakeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = intakeIdParamSchema.parse(req.params);
      const currentUserId = req.user?.id ?? '';
      const intake = await intakeService.getIntakeById(currentUserId ?? '', params.intakeId);
      res.status(200).json({ success: true, data: intake });
    } catch (e) {
      next(e);
    }
  },
};
