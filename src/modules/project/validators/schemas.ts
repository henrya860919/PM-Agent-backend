// src/modules/project/validators/schemas.ts

import { ALLOWED_PROJECT_SORT_FIELDS, PROJECT_STATUS } from '@/constants/project';
import { createPaginationWithSearchSchema } from '@/shared/validators/rules/pagination.rules';
import { createSortSchema } from '@/shared/validators/rules/sort.rules';
import { z } from 'zod';

export const listProjectsQuerySchema = createPaginationWithSearchSchema('1', '10', 100, 100);

// 日期驗證輔助函數：驗證結束日期必須大於或等於開始日期
export const validateEndDateAfterStartDate = <
  T extends { startDate?: string | null; [key: string]: any },
>(
  data: T,
  endDateField: keyof T,
  errorMessage: string,
): boolean => {
  const startDate = data.startDate;
  const endDate = data[endDateField] as string | null | undefined;

  if (startDate && endDate) {
    return new Date(endDate) >= new Date(startDate);
  }
  return true;
};

// 專案 ID 路由參數驗證規則
export const projectCodeParamSchema = z.object({
  projectCode: z.string(),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().uuid('專案 ID 格式錯誤'),
});

// 專案代碼驗證規則：只能包含小寫英文字母、數字和連字符，最多10個字元
const projectCodeRegex = /^[a-z0-9-]+$/;

// 專案建立驗證規則
export const createProjectSchema = z
  .object({
    name: z.string().min(1, '專案名稱不能為空').max(100, '專案名稱最多 100 個字元'),
    code: z
      .string()
      .min(1, '專案代碼不能為空')
      .max(10, '專案代碼最多 10 個字元')
      .regex(projectCodeRegex, '專案代碼只能包含小寫英文字母、數字和連字符（-）'),
    ownerId: z.string().uuid('Owner ID 格式錯誤').optional(),
    description: z.string().max(100, '專案描述最多 100 個字元').optional(),
    client: z.string().max(10, '業主名稱最多 10 個字元').optional(),
    startDate: z
      .preprocess(
        (val) => (val === '' ? undefined : val),
        z.string().datetime('開始日期格式錯誤').optional(),
      )
      .optional(),
    expectedEndDate: z
      .preprocess(
        (val) => (val === '' ? undefined : val),
        z.string().datetime('預計完成日期格式錯誤').optional(),
      )
      .optional(),
    address: z.string().max(100, '詳細地址最多 100 個字元').optional(),
  })
  .refine(
    (data) =>
      validateEndDateAfterStartDate(data, 'expectedEndDate', '預計完成日期必須大於或等於開始日期'),
    {
      message: '預計完成日期必須大於或等於開始日期',
      path: ['expectedEndDate'],
    },
  );

// 專案查詢參數驗證規則
export const getProjectsQuerySchema = createPaginationWithSearchSchema('1', '10', 100, 100).merge(
  createSortSchema(ALLOWED_PROJECT_SORT_FIELDS),
);

// 專案更新驗證規則
export const updateProjectSchema = z
  .object({
    name: z.string().min(1, '專案名稱不能為空').max(100, '專案名稱最多 100 個字元').optional(),
    code: z
      .string()
      .min(1, '專案代碼不能為空')
      .max(10, '專案代碼最多 10 個字元')
      .regex(projectCodeRegex, '專案代碼只能包含小寫英文字母、數字和連字符（-）')
      .optional(),
    ownerId: z.string().uuid('Owner ID 格式錯誤').optional(),
    description: z.string().max(100, '專案描述最多 100 個字元').optional().nullable(), // 允許清空
    status: z.nativeEnum(PROJECT_STATUS).optional(),
    client: z.string().max(10, '業主名稱最多 10 個字元').optional(),
    startDate: z
      .preprocess(
        (val) => (val === '' ? null : val),
        z.string().datetime('開始日期格式錯誤').nullable(),
      )
      .optional(),
    expectedEndDate: z
      .preprocess(
        (val) => (val === '' ? null : val),
        z.string().datetime('預計完成日期格式錯誤').nullable(),
      )
      .optional(),
    address: z.string().max(100, '詳細地址最多 100 個字元').optional().nullable(),
  })
  .refine(
    (data) =>
      validateEndDateAfterStartDate(data, 'expectedEndDate', '結束日期必須大於或等於開始日期'),
    {
      message: '結束日期必須大於或等於開始日期',
      path: ['endDate'],
    },
  );

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type ProjectCodeParam = z.infer<typeof projectCodeParamSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type GetProjectsQuery = z.infer<typeof getProjectsQuerySchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
