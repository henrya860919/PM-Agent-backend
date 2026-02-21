// src/modules/project/service.ts

import { PROJECT_STATUS } from '@/constants/project';
import { prisma } from '@/lib/prisma';
import { projectRepository } from '@/modules/project/repository';
import {
  ProjectDto,
  ProjectEntity,
  ProjectListDto,
  ProjectListItemDto,
} from '@/modules/project/type';
import {
  CreateProjectInput,
  GetProjectsQuery,
  UpdateProjectInput,
} from '@/modules/project/validators/schemas';
import { validateUniqueProjectCode } from '@/modules/project/validators/rules';
import { BadRequestError, NotFoundError } from '@/shared/types/errors.type';
import { PrismaTransaction } from '@/shared/types/prisma.types';

// 簡化的 UserContext（暫時不需要完整的權限系統）
export type UserContext = {
  id: string;
};

export const projectService = {
  // 取得專案列表
  async getProjects(user: UserContext, query: GetProjectsQuery): Promise<ProjectListDto> {
    const result = await projectRepository.findMany(query);

    const items: ProjectListItemDto[] = result.data.map((project) =>
      this.transformToListItemDto(project),
    );

    return {
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalAll: result.totalAll,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  },

  // 建立專案
  async createProject(user: UserContext, data: CreateProjectInput): Promise<ProjectDto> {
    // 檢查專案代碼是否唯一
    await validateUniqueProjectCode(data.code);

    // 如果沒有提供 ownerId，使用當前使用者作為 owner
    const ownerId = data.ownerId || user.id;

    // 使用 transaction 建立專案
    const newProject = await prisma.$transaction(async (tx: PrismaTransaction) => {
      // 建立專案
      const project = await projectRepository.create(
        {
          name: data.name,
          code: data.code,
          description: data.description,
          ownerId: ownerId,
          client: data.client,
          expectedEndDate: data.expectedEndDate,
          startDate: data.startDate,
          address: data.address,
          createdById: user.id,
        },
        tx,
      );
      return project;
    });

    return this.transformToDto(newProject);
  },

  // 取得專案詳情
  async getProject(user: UserContext, projectCode: string): Promise<ProjectDto> {
    const project = await projectRepository.findByCode(projectCode);

    if (!project) {
      throw new NotFoundError('找不到該專案', 'PROJECT');
    }

    return this.transformToDto(project);
  },

  // 更新專案
  async updateProject(
    user: UserContext,
    projectCode: string,
    data: UpdateProjectInput,
  ): Promise<ProjectDto> {
    // 先查找專案
    const existingProject = await projectRepository.findByCode(projectCode);
    if (!existingProject) {
      throw new NotFoundError('找不到該專案', 'PROJECT');
    }

    // 如果要更新 code，檢查新 code 是否唯一（排除自己）
    if (data.code && data.code !== projectCode) {
      await validateUniqueProjectCode(data.code, projectCode);
    }

    // 使用 transaction 更新專案
    const updatedProject = await prisma.$transaction(async (tx: PrismaTransaction) => {
      const project = await projectRepository.update(existingProject.uuid, data, tx);
      if (!project) {
        throw new BadRequestError('無法更新專案，請確認專案狀態是否為進行中');
      }
      return project;
    });

    return this.transformToDto(updatedProject);
  },

  // 刪除專案
  async deleteProject(user: UserContext, projectCode: string): Promise<void> {
    const project = await projectRepository.findByCode(projectCode);
    if (!project) {
      throw new NotFoundError('找不到該專案', 'PROJECT');
    }

    // 驗證專案狀態
    if (project.status !== PROJECT_STATUS.IN_PROGRESS) {
      throw new BadRequestError('只有進行中的專案可以刪除');
    }

    await prisma.$transaction(async (tx: PrismaTransaction) => {
      await projectRepository.delete(project.uuid, user.id, tx);
    });
  },

  // 轉換 Entity 為 DTO
  transformToDto(project: ProjectEntity): ProjectDto {
    return {
      id: project.uuid,
      name: project.name,
      code: project.code,
      description: project.description,
      status: project.status,
      client: project.client,
      startDate: project.startDate,
      expectedEndDate: project.expectedEndDate,
      address: project.address,
      owner: {
        id: project.owner.uuid,
        username: project.owner.username,
        displayName: project.owner.displayName,
      },
    };
  },

  // 轉換 Entity 為 ListItem DTO
  transformToListItemDto(project: ProjectEntity): ProjectListItemDto {
    return {
      id: project.uuid,
      name: project.name,
      code: project.code,
      status: project.status,
      address: project.address,
      createdAt: project.createdAt,
      owner: {
        id: project.owner.uuid,
        username: project.owner.username,
        displayName: project.owner.displayName,
      },
    };
  },
};
