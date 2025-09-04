import { Project, ProjectStatus } from '@prisma/client';
import { prisma } from '../config/database';

export interface CreateProjectData {
  userId: string;
  title: string;
  description?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  status?: ProjectStatus;
}

export class ProjectService {
  static async createProject(data: CreateProjectData): Promise<Project> {
    return await prisma.project.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        status: data.status || 'DRAFT',
      },
    });
  }

  static async getProjectById(id: string, userId?: string): Promise<Project | null> {
    const where = userId ? { id, userId } : { id };
    return await prisma.project.findUnique({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  static async updateProject(id: string, data: UpdateProjectData, userId?: string): Promise<Project | null> {
    try {
      const where = userId ? { id, userId } : { id };
      return await prisma.project.update({
        where,
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      return null;
    }
  }

  static async deleteProject(id: string, userId?: string): Promise<boolean> {
    try {
      const where = userId ? { id, userId } : { id };
      await prisma.project.delete({
        where,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getAllProjects(userId?: string): Promise<Project[]> {
    const where = userId ? { userId } : {};
    return await prisma.project.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async getProjectsByStatus(status: ProjectStatus, userId?: string): Promise<Project[]> {
    const where = userId ? { userId, status } : { status };
    return await prisma.project.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async getUserProjects(userId: string): Promise<Project[]> {
    return await prisma.project.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
