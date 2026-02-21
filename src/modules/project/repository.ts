// src/modules/project/repository.ts

import { PROJECT_SORT_FIELDS, PROJECT_STATUS } from '@/constants/project';
import { prisma } from '@/lib/prisma';
import { createProjectData, ProjectEntity } from '@/modules/project/type';
import { GetProjectsQuery, UpdateProjectInput } from '@/modules/project/validators/schemas';
import { PrismaTransaction } from '@/shared/types/prisma.types';
import { buildSortOrderBy } from '@/shared/utils/sort.utils';
import { Prisma } from '@prisma/client';

const projectSelect = {
  id: true,
  uuid: true,
  name: true,
  code: true,
  description: true,
  status: true,
  address: true,
  startDate: true,
  expectedEndDate: true,
  client: true,
  createdAt: true,
  createdById: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
  owner: {
    select: {
      uuid: true,
      username: true,
      displayName: true,
    },
  },
} satisfies Prisma.ProjectSelect;

export const projectRepository = {
  // 建立專案
  async create(data: createProjectData, tx?: PrismaTransaction): Promise<ProjectEntity> {
    const client = tx ?? prisma;
    const project = await client.project.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        ownerId: data.ownerId,
        client: data.client ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
        address: data.address ?? null,
        createdById: data.createdById,
        status: PROJECT_STATUS.IN_PROGRESS,
      },
      select: projectSelect,
    });

    return project;
  },

  // 查詢多個專案，支援分頁、搜尋、排序和篩選
  async findMany(
    query: GetProjectsQuery,
  ): Promise<{ data: ProjectEntity[]; total: number; totalAll: number }> {
    const skip = (query.page - 1) * query.limit;

    // 建立基礎查詢條件（不含篩選）
    const baseWhere: Prisma.ProjectWhereInput = {
      deletedAt: null,
    };

    // 建立完整查詢條件（基礎條件 + 搜尋篩選）
    const where: Prisma.ProjectWhereInput = {
      ...baseWhere,
      // 搜尋功能：搜尋專案名稱
      ...(query.search && {
        name: {
          contains: query.search,
          mode: 'insensitive',
        },
      }),
    };

    // 構建排序條件
    const sortFieldMap: Record<
      string,
      (order: 'asc' | 'desc') => Prisma.ProjectOrderByWithRelationInput
    > = {
      [PROJECT_SORT_FIELDS.NAME]: (order) => ({ name: order }),
      [PROJECT_SORT_FIELDS.CODE]: (order) => ({ code: order }),
      [PROJECT_SORT_FIELDS.STATUS]: (order) => ({ status: order }),
      [PROJECT_SORT_FIELDS.OWNER_DISPLAY_NAME]: (order) => ({ owner: { displayName: order } }),
    };

    const orderBy = buildSortOrderBy(
      query.sort,
      query.order,
      sortFieldMap,
      { code: 'asc' }, // 預設排序：按專案代碼升序
    );

    // 同時查詢資料、篩選後的總數和未篩選的總數
    const [projects, total, totalAll] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        select: projectSelect,
      }),
      prisma.project.count({ where }),
      prisma.project.count({ where: baseWhere }),
    ]);

    return {
      data: projects,
      total,
      totalAll,
    };
  },

  // 根據專案代碼查詢單一專案
  async findByCode(code: string, excludeCode?: string): Promise<ProjectEntity | null> {
    // 如果 excludeCode 存在且與 code 相同，則不查詢（用於更新時排除自身）
    if (excludeCode && excludeCode === code) {
      return null;
    }

    const project = await prisma.project.findFirst({
      where: {
        code,
        deletedAt: null,
      },
      select: projectSelect,
    });

    return project ?? null;
  },

  // 根據專案 UUID 查詢單一專案
  async findByUuid(uuid: string): Promise<ProjectEntity | null> {
    const project = await prisma.project.findFirst({
      where: {
        uuid,
        deletedAt: null,
      },
      select: projectSelect,
    });

    return project ?? null;
  },

  // 更新專案
  async update(
    uuid: string,
    data: UpdateProjectInput,
    tx?: PrismaTransaction,
  ): Promise<ProjectEntity | null> {
    const client = tx ?? prisma;

    // 特例：如果要更新狀態為 IN_PROGRESS（恢復狀態），則允許更新，即使當前狀態不是 IN_PROGRESS
    const isRestoringStatus = data.status === PROJECT_STATUS.IN_PROGRESS;

    // 先查找專案，驗證條件
    const existingProject = await client.project.findFirst({
      where: {
        uuid,
        deletedAt: null,
        // 如果是要恢復狀態，則不限制當前狀態；否則只允許 IN_PROGRESS 的專案更新
        ...(isRestoringStatus ? {} : { status: PROJECT_STATUS.IN_PROGRESS }),
      },
    });

    if (!existingProject) {
      return null;
    }

    // 使用 uuid 作為唯一標識符進行更新
    const project = await client.project.update({
      where: { uuid },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.client !== undefined && { client: data.client }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.expectedEndDate !== undefined && {
          expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
        }),
        ...(data.address !== undefined && { address: data.address }),
      },
      select: projectSelect,
    });

    return project;
  },

  // 刪除專案（軟刪除）
  async delete(projectUuid: string, deletedById: string, tx?: PrismaTransaction): Promise<void> {
    const client = tx ?? prisma;
    const deletedAt = new Date();

    await client.project.update({
      where: { uuid: projectUuid },
      data: {
        deletedAt,
        deletedById,
      },
    });
  },
};
