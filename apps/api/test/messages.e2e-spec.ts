import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { ConversationType } from '@prisma/client';

describe('Persistent Messaging & Collaboration (e2e)', () => {
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

  describe('Conversation Listing & Anti-Enumeration', () => {
    it('returns conversations for authenticated client', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/conversations')
        .set('x-mock-user-id', 'client_1')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('returns 404 Not Found for non-existent or foreign conversation ID', async () => {
      await request(app.getHttpServer())
        .get('/api/conversations/non_existent_id/messages')
        .set('x-mock-user-id', 'client_1')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(404);
    });
  });

  describe('Message Sending & Idempotency', () => {
    it('persists message and returns 201 Created', async () => {
      const idempotencyKey = `idem-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/conversations/conv_1/messages')
        .set('x-mock-user-id', 'client_1')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .send({
          content: 'Here is the deliverable feedback.',
          idempotencyKey,
        })
        .expect(201);

      expect(res.body.content).toBe('Here is the deliverable feedback.');
      expect(res.body.idempotencyKey).toBe(idempotencyKey);
    });

    it('re-sending the same idempotencyKey returns existing message safely', async () => {
      const idempotencyKey = `idem-repeat-${Date.now()}`;

      // First send
      const firstRes = await request(app.getHttpServer())
        .post('/api/conversations/conv_1/messages')
        .set('x-mock-user-id', 'client_1')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .send({
          content: 'Initial send',
          idempotencyKey,
        })
        .expect(201);

      // Duplicate send with same idempotencyKey
      const secondRes = await request(app.getHttpServer())
        .post('/api/conversations/conv_1/messages')
        .set('x-mock-user-id', 'client_1')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .send({
          content: 'Initial send',
          idempotencyKey,
        })
        .expect(201);

      expect(secondRes.body.id).toBe(firstRes.body.id);
    });
  });

  describe('Owner Administrative Boundaries', () => {
    it('allows Owner to create group conversation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/conversations')
        .set('x-mock-user-id', 'owner_1')
        .set('x-mock-role', 'Owner')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-mfa', 'true')
        .send({
          type: ConversationType.GROUP,
          title: 'Design Review Group',
          projectId: 'proj_1',
          participantUserIds: ['client_1'],
        })
        .expect(201);

      expect(res.body.type).toBe(ConversationType.GROUP);
      expect(res.body.title).toBe('Design Review Group');
    });

    it('denies Client from creating group conversation', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/conversations')
        .set('x-mock-user-id', 'client_1')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .send({
          type: ConversationType.GROUP,
          title: 'Unauthorized Client Group',
          projectId: 'proj_1',
          participantUserIds: ['client_2'],
        })
        .expect(403);
    });
  });
});
