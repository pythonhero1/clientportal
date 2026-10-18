import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/portal_dev';
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    if (process.env.DATABASE_URL) {
      try {
        await this.$connect();
      } catch {
        // Allow offline test/mock environments without live PostgreSQL
      }
    }
  }

  async onModuleDestroy() {
    if (process.env.DATABASE_URL) {
      try {
        await this.$disconnect();
      } catch {}
    }
  }
}
