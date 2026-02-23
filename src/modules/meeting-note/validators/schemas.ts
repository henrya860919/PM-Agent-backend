import { z } from 'zod';

export const createFromIntakeSchema = z.object({
  intakeId: z.string().uuid('Intake ID 格式錯誤'),
  template: z.enum(['general', 'requirement_discussion', 'contract_review', 'sprint_retro']).optional().default('general'),
});

export type CreateFromIntakeInput = z.infer<typeof createFromIntakeSchema>;

/** 手動建立空白會議記錄／備忘錄（規格 MN-1.1、MN-2.1） */
export const createMeetingNoteSchema = z.object({
  type: z.enum(['meeting_note', 'memo']),
  title: z.string().min(1, '標題必填').max(500),
  content: z.string().optional().default(''),
  projectId: z.string().uuid().optional(),
});

export type CreateMeetingNoteInput = z.infer<typeof createMeetingNoteSchema>;

export const meetingNoteIdParamSchema = z.object({
  meetingNoteId: z.string().uuid('會議記錄 ID 格式錯誤'),
});

export const updateMeetingNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
});
