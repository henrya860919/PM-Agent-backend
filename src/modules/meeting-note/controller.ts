import { meetingNoteService } from '@/modules/meeting-note/service';
import {
  createFromIntakeSchema,
  createMeetingNoteSchema,
  meetingNoteIdParamSchema,
  updateMeetingNoteSchema,
} from '@/modules/meeting-note/validators/schemas';
import type { Request, Response, NextFunction } from 'express';

export const meetingNoteController = {
  /** POST /meeting-notes/from-intake - 從 Intake 一鍵生成會議記錄（規格 IA-4.1） */
  async createFromIntake(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createFromIntakeSchema.parse(req.body);
      const userId = req.user?.id ?? '';
      const note = await meetingNoteService.createFromIntake(userId, body.intakeId, body.template);
      res.status(201).json({ success: true, data: note });
    } catch (e) {
      next(e);
    }
  },

  /** POST /meeting-notes - 手動建立空白會議記錄／備忘錄（規格 MN-1.1） */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createMeetingNoteSchema.parse(req.body);
      const userId = req.user?.id ?? '';
      const note = await meetingNoteService.createBlank(userId, {
        type: body.type,
        title: body.title,
        content: body.content,
        projectId: body.projectId ?? null,
      });
      res.status(201).json({ success: true, data: note });
    } catch (e) {
      next(e);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = meetingNoteIdParamSchema.parse(req.params);
      const userId = req.user?.id ?? '';
      const note = await meetingNoteService.getById(userId, params.meetingNoteId);
      res.status(200).json({ success: true, data: note });
    } catch (e) {
      next(e);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.query.projectId as string | undefined;
      const type = req.query.type as 'meeting_note' | 'memo' | undefined;
      const sourceIntakeId = req.query.sourceIntakeId as string | undefined;
      const search = req.query.search as string | undefined;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const userId = req.user?.id ?? '';
      const result = await meetingNoteService.list(userId, {
        projectId,
        type,
        sourceIntakeId,
        search,
        page,
        limit,
      });
      res.status(200).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = meetingNoteIdParamSchema.parse(req.params);
      const userId = req.user?.id ?? '';
      await meetingNoteService.delete(userId, params.meetingNoteId);
      res.sendStatus(204);
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = meetingNoteIdParamSchema.parse(req.params);
      const body = updateMeetingNoteSchema.parse(req.body);
      const userId = req.user?.id ?? '';
      const note = await meetingNoteService.update(userId, params.meetingNoteId, body);
      res.status(200).json({ success: true, data: note });
    } catch (e) {
      next(e);
    }
  },
};
