import { defineConfig } from 'prisma/config';

function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || '';
  url = url.trim().replace(/^["']|["']$/g, '');
  if (url.startsWith('DATABASE_URL=')) {
    url = url.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
  }
  return url;
}

export default defineConfig({
  schema: 'apps/api/prisma/schema.prisma',
  datasource: {
    url: getDatabaseUrl(),
  },
});
