// src/modules/project/type.ts

import { Pagination } from '@/shared/types/api.type';

// service to repo
export type createProjectData = {
  createdById: string;
  name: string;
  code: string;
  ownerId: string;
  description?: string;
  client?: string;
  startDate?: string;
  expectedEndDate?: string;
  address?: string;
};

export type updateProjectData = {
  name?: string;
  code?: string;
  description?: string;
  client?: string;
  ownerId?: string;
  status?: string;
  startDate?: string;
  expectedEndDate?: string;
  address?: string;
};

// repo to service
export type ProjectEntity = {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description: string | null;
  client: string | null;
  startDate: Date | null;
  expectedEndDate: Date | null;
  address: string | null;
  status: string;
  createdAt: Date;
  createdById: string | null;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedById: string | null;
  owner: {
    uuid: string;
    username: string;
    displayName: string;
  };
};

// service to api
export type ProjectDto = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  client: string | null;
  startDate: Date | null;
  expectedEndDate: Date | null;
  address: string | null;
  owner: {
    id: string;
    username: string;
    displayName: string;
  };
};

export type ProjectListItemDto = {
  id: string;
  name: string;
  code: string;
  status: string;
  address: string | null;
  createdAt: Date;
  owner: {
    id: string;
    username: string;
    displayName: string;
  };
};

// service to api
export type ProjectListDto = {
  data: ProjectListItemDto[];
  pagination: Pagination;
};
