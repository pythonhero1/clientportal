import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Meetings & Calendar (e2e)', () => {
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
      .get('/api/meetings')
      .expect(401);
  });

  it('allows authenticated client to query their meetings', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/meetings')
      .set('x-mock-user-id', 'client_1')
      .set('x-mock-role', 'Client')
      .set('x-mock-status', 'ACTIVE')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('generates a signed Cal.com booking token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/meetings/token')
      .set('x-mock-user-id', 'client_1')
      .set('x-mock-role', 'Client')
      .set('x-mock-status', 'ACTIVE')
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.expiresAt).toBeDefined();
  });

  it('allows Owner to access global meetings and blocks Client with 403', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/meetings')
      .set('x-mock-user-id', 'owner_1')
      .set('x-mock-role', 'Owner')
      .set('x-mock-status', 'ACTIVE')
      .set('x-mock-mfa', 'true')
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/admin/meetings')
      .set('x-mock-user-id', 'client_1')
      .set('x-mock-role', 'Client')
      .set('x-mock-status', 'ACTIVE')
      .expect(403);
  });
});
