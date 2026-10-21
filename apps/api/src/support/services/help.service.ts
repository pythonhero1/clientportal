import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateHelpCategoryDto } from '../dto/create-help-category.dto.js';
import { CreateHelpArticleDto } from '../dto/create-help-article.dto.js';
import { UpdateHelpArticleDto } from '../dto/update-help-article.dto.js';

@Injectable()
export class HelpService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories(includeUnpublished: boolean = false) {
    if (!process.env.DATABASE_URL) {
      return [
        { id: 'cat_general', name: 'General & Overview', slug: 'general', orderIndex: 0, _count: { articles: 2 } },
        { id: 'cat_deliverables', name: 'Files & Reviews', slug: 'deliverables', orderIndex: 1, _count: { articles: 2 } },
        { id: 'cat_billing', name: 'Billing & Invoices', slug: 'billing', orderIndex: 2, _count: { articles: 1 } },
      ];
    }

    return this.prisma.helpCategory.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: {
            articles: includeUnpublished ? true : { where: { isPublished: true } },
          },
        },
      },
    });
  }

  async createCategory(dto: CreateHelpCategoryDto) {
    if (!process.env.DATABASE_URL) {
      return { id: 'cat_mock', ...dto };
    }

    const slug = dto.slug || this.slugify(dto.name);
    const existing = await this.prisma.helpCategory.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Category with slug "${slug}" already exists.`);
    }

    return this.prisma.helpCategory.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        orderIndex: dto.orderIndex ?? 0,
      },
    });
  }

  async getArticles(categoryId?: string, search?: string, includeUnpublished: boolean = false) {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    const where: any = {};
    if (!includeUnpublished) {
      where.isPublished = true;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.helpArticle.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ orderIndex: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async getArticleBySlug(slug: string, includeUnpublished: boolean = false) {
    if (!process.env.DATABASE_URL) {
      return null;
    }

    const where: any = { slug };
    if (!includeUnpublished) {
      where.isPublished = true;
    }

    const article = await this.prisma.helpArticle.findFirst({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found.');
    }

    return article;
  }

  async createArticle(dto: CreateHelpArticleDto, authorId?: string) {
    if (!process.env.DATABASE_URL) {
      return { id: 'art_mock', ...dto };
    }

    const slug = dto.slug || this.slugify(dto.title);
    const existing = await this.prisma.helpArticle.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Article with slug "${slug}" already exists.`);
    }

    return this.prisma.helpArticle.create({
      data: {
        categoryId: dto.categoryId,
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt,
        isPublished: dto.isPublished ?? true,
        publishedAt: dto.isPublished ? new Date() : null,
        orderIndex: dto.orderIndex ?? 0,
        authorId: authorId || null,
      },
    });
  }

  async updateArticle(id: string, dto: UpdateHelpArticleDto) {
    if (!process.env.DATABASE_URL) {
      return { id, ...dto };
    }

    const article = await this.prisma.helpArticle.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found.');
    }

    const updateData: any = { ...dto, updatedAt: new Date() };
    if (dto.isPublished !== undefined) {
      if (dto.isPublished && !article.isPublished) {
        updateData.publishedAt = new Date();
      } else if (!dto.isPublished) {
        updateData.publishedAt = null;
      }
    }

    return this.prisma.helpArticle.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteArticle(id: string) {
    if (!process.env.DATABASE_URL) {
      return { id, deleted: true };
    }

    await this.prisma.helpArticle.delete({
      where: { id },
    });

    return { id, deleted: true };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
