import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Notifications & Push (e2e)', () => {
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
      .get('/api/notifications')
      .expect(401);
  });

  it('allows authenticated client to get notifications and preferences', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('x-mock-user-id', 'client_1')
      .set('x-mock-role', 'Client')
      .set('x-mock-status', 'ACTIVE')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    const prefRes = await request(app.getHttpServer())
      .get('/api/notifications/preferences')
      .set('x-mock-user-id', 'client_1')
      .set('x-mock-role', 'Client')
      .set('x-mock-status', 'ACTIVE')
      .expect(200);

    expect(prefRes.body.inAppDeliverables).toBeDefined();
  });
});
