// src/shared/validators/rules/sort.rules.ts

import { z } from 'zod';

/**
 * 通用的排序參數驗證規則
 * 可在多個查詢 schema 中重複使用
 */

/**
 * 排序參數 schema
 * @param allowedFields 允許排序的字段列表
 */
export const createSortSchema = <T extends readonly [string, ...string[]]>(
  allowedFields: T,
) => {
  return z.object({
    sort: z.enum(allowedFields).optional(),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
  });
};
