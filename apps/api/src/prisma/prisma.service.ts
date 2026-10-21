import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/portal_dev';
    const isRemote = Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'));
    let sanitizedUrl = connectionString;
    if (isRemote) {
      sanitizedUrl = sanitizedUrl.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
    }
    const pool = new pg.Pool({
      connectionString: sanitizedUrl,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    });
    const adapter = new PrismaPg(pool);
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
