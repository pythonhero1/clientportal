import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Invoices & Billing (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects unauthenticated request with 401', async () => {
    await request(app.getHttpServer())
      .get('/api/projects/proj_1/invoices')
      .expect(401);
  });

  it('allows Owner to access global ledger', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/invoices')
      .set('x-mock-user-id', 'owner_1')
      .set('x-mock-role', 'Owner')
      .set('x-mock-status', 'ACTIVE')
      .set('x-mock-mfa', 'true')
      .expect(200);
  });

  it('blocks non-Owner from admin invoices endpoint with 403', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/invoices')
      .set('x-mock-user-id', 'client_1')
      .set('x-mock-role', 'Client')
      .set('x-mock-status', 'ACTIVE')
      .expect(403);
  });
});
