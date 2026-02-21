// src/shared/validators/rules/pagination.rules.ts

import { z } from 'zod';

/**
 * 通用的分頁和搜尋參數驗證規則
 * 可在多個查詢 schema 中重複使用
 */

/**
 * 分頁參數 schema
 * @param defaultPage 預設頁碼，預設為 '1'
 * @param defaultLimit 預設每頁數量，預設為 '20'
 * @param maxLimit 最大每頁數量，預設為 100
 */
export const createPaginationSchema = (
  defaultPage: string = '1',
  defaultLimit: string = '20',
  maxLimit: number = 100,
) => {
  return z.object({
    page: z
      .string()
      .optional()
      .default(defaultPage)
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, '頁碼必須大於 0'),
    limit: z
      .string()
      .optional()
      .default(defaultLimit)
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= maxLimit, `每頁數量必須在 1-${maxLimit} 之間`),
  });
};

/**
 * 搜尋參數 schema
 * @param maxLength 搜尋字串最大長度，預設為 100
 */
export const createSearchSchema = (maxLength: number = 100) => {
  return z.object({
    search: z.string().max(maxLength).optional(),
  });
};

/**
 * 完整的分頁和搜尋參數 schema（最常用的組合）
 * @param defaultPage 預設頁碼，預設為 '1'
 * @param defaultLimit 預設每頁數量，預設為 '20'
 * @param maxLimit 最大每頁數量，預設為 100
 * @param searchMaxLength 搜尋字串最大長度，預設為 100
 */
export const createPaginationWithSearchSchema = (
  defaultPage: string = '1',
  defaultLimit: string = '20',
  maxLimit: number = 100,
  searchMaxLength: number = 100,
) => {
  return createPaginationSchema(defaultPage, defaultLimit, maxLimit).merge(
    createSearchSchema(searchMaxLength),
  );
};
