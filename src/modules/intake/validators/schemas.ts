// src/modules/intake/validators/schemas.ts
// Intake API 請求驗證（規格 IA-1 列表參數）

import { createPaginationSchema } from '@/shared/validators/rules/pagination.rules';
import { INTAKE_STATUS } from '@/constants/intake';
import { z } from 'zod';

const statusEnum = z.enum([
  INTAKE_STATUS.PROCESSING,
  INTAKE_STATUS.COMPLETED,
  INTAKE_STATUS.TRANSCRIPT_OK_ANALYSIS_FAILED,
  INTAKE_STATUS.FAILED,
]);

export const getIntakesQuerySchema = createPaginationSchema('1', '20', 100).extend({
  projectId: z.string().uuid().optional(),
  status: statusEnum.optional(),
});

export type GetIntakesQuery = z.infer<typeof getIntakesQuerySchema>;

export const intakeIdParamSchema = z.object({
  intakeId: z.string().uuid('Intake ID 格式錯誤'),
});

export type IntakeIdParam = z.infer<typeof intakeIdParamSchema>;
