// src/shared/utils/sort.utils.ts

/**
 * 通用的排序工具函數
 * 用於構建 Prisma orderBy 條件
 */

export type SortOrder = 'asc' | 'desc';

/**
 * 排序字段映射函數類型
 */
export type SortFieldBuilder<T> = (order: SortOrder) => T;

/**
 * 構建排序條件
 * @param sort 排序字段
 * @param order 排序方向
 * @param sortFieldMap 排序字段映射配置
 * @param defaultSort 預設排序（當 sort 為空或找不到對應字段時使用）
 * @returns Prisma orderBy 條件
 */
export function buildSortOrderBy<T>(
  sort: string | undefined,
  order: SortOrder | undefined,
  sortFieldMap: Record<string, SortFieldBuilder<T>>,
  defaultSort: T,
): T {
  if (!sort) {
    return defaultSort;
  }

  const sortOrder = order || 'asc';
  const sortBuilder = sortFieldMap[sort];

  if (sortBuilder) {
    return sortBuilder(sortOrder);
  }

  // 如果找不到對應的排序字段，返回預設排序
  return defaultSort;
}
