import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Support & Help Center (e2e)', () => {
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
      .get('/api/support/tickets')
      .expect(401);
  });

  it('allows authenticated client to query tickets and published articles', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/support/tickets')
      .set('x-mock-user-id', 'client_1')
      .set('x-mock-role', 'Client')
      .set('x-mock-status', 'ACTIVE')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    const artRes = await request(app.getHttpServer())
      .get('/api/support/articles')
      .set('x-mock-user-id', 'client_1')
      .set('x-mock-role', 'Client')
      .set('x-mock-status', 'ACTIVE')
      .expect(200);

    expect(Array.isArray(artRes.body)).toBe(true);
  });

  it('allows Owner to access support triage queue and blocks Client with 403', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/support/tickets')
      .set('x-mock-user-id', 'owner_1')
      .set('x-mock-role', 'Owner')
      .set('x-mock-status', 'ACTIVE')
      .set('x-mock-mfa', 'true')
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/admin/support/tickets')
      .set('x-mock-user-id', 'client_1')
      .set('x-mock-role', 'Client')
      .set('x-mock-status', 'ACTIVE')
      .expect(403);
  });
});
