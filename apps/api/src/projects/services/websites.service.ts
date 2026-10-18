import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateWebsiteDto } from '../dto/create-website.dto.js';
import { UpdateWebsiteDto } from '../dto/update-website.dto.js';

@Injectable()
export class WebsitesService {
  constructor(private prisma: PrismaService) {}

  async getWebsitesForProject(projectId: string) {
    if (!process.env.DATABASE_URL) {
      return [
        {
          id: `web_${projectId}_1`,
          projectId,
          name: 'Staging Environment',
          url: 'https://staging.example.com',
          environment: 'STAGING',
          status: 'LIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `web_${projectId}_2`,
          projectId,
          name: 'Production Website',
          url: 'https://example.com',
          environment: 'PRODUCTION',
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    return this.prisma.website.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createWebsite(projectId: string, dto: CreateWebsiteDto) {
    if (!process.env.DATABASE_URL) {
      return {
        id: `web_${Date.now()}`,
        projectId,
        name: dto.name,
        url: dto.url,
        environment: dto.environment || 'STAGING',
        status: dto.status || 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return this.prisma.website.create({
      data: {
        projectId,
        name: dto.name,
        url: dto.url,
        environment: (dto.environment as any) || 'STAGING',
        status: (dto.status as any) || 'DRAFT',
      },
    });
  }

  async updateWebsite(projectId: string, websiteId: string, dto: UpdateWebsiteDto) {
    if (!process.env.DATABASE_URL) {
      return {
        id: websiteId,
        projectId,
        ...dto,
        updatedAt: new Date().toISOString(),
      };
    }

    const existing = await this.prisma.website.findFirst({
      where: { id: websiteId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Website record not found for this project.');
    }

    return this.prisma.website.update({
      where: { id: websiteId },
      data: {
        name: dto.name,
        url: dto.url,
        environment: dto.environment as any,
        status: dto.status as any,
      },
    });
  }

  async deleteWebsite(projectId: string, websiteId: string) {
    if (!process.env.DATABASE_URL) {
      return { success: true };
    }

    const existing = await this.prisma.website.findFirst({
      where: { id: websiteId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Website record not found for this project.');
    }

    await this.prisma.website.delete({
      where: { id: websiteId },
    });

    return { success: true };
  }
}
