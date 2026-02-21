// src/shared/types/api.type.ts

export type Pagination = {
  page: number;
  limit: number;
  total: number; // 当前查询条件下的数量（包含搜索条件）
  totalAll: number; // 全部数量（不管筛选条件）
  totalPages: number;
};
