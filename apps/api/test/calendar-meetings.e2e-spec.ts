import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('Cal.com Webhook, Project Meetings & Unified Calendar (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
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

  describe('Cal.com Webhook Verification & Lifecycle', () => {
    const bookingUid = `b_test_${Date.now()}`;

    it('rejects webhook request with invalid signature', async () => {
      await request(app.getHttpServer())
        .post('/api/webhooks/calcom')
        .set('x-cal-signature-256', 'invalid_signature_hex')
        .send({
          triggerEvent: 'BOOKING_CREATED',
          payload: {
            uid: bookingUid,
            title: 'Strategy Session',
          },
        })
        .expect(400);
    });

    it('accepts and processes valid BOOKING_CREATED webhook', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/webhooks/calcom')
        .set('x-cal-signature-256', 'valid_test_signature')
        .send({
          triggerEvent: 'BOOKING_CREATED',
          payload: {
            uid: bookingUid,
            title: 'Strategy & Architecture Walkthrough',
            startTime: '2026-10-21T15:00:00.000Z',
            endTime: '2026-10-21T15:30:00.000Z',
            organizer: {
              name: 'Oderinde Stephen',
              email: 'stephen@oderindestephen.com',
              timeZone: 'Africa/Lagos',
            },
            attendees: [
              {
                name: 'Client User',
                email: 'client_a@example.com',
                timeZone: 'Africa/Lagos',
              },
            ],
            meetingUrl: 'https://meet.google.com/abc-defg-hij',
            metadata: {
              projectId: 'proj_1',
            },
          },
        })
        .expect(200);

      expect(res.body.received).toBe(true);
    });

    it('processes BOOKING_RESCHEDULED event safely', async () => {
      const rescheduledUid = `b_resched_${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/webhooks/calcom')
        .set('x-cal-signature-256', 'valid_test_signature')
        .send({
          triggerEvent: 'BOOKING_RESCHEDULED',
          payload: {
            uid: rescheduledUid,
            rescheduleUid: bookingUid,
            title: 'Strategy & Architecture Walkthrough (Rescheduled)',
            startTime: '2026-10-22T10:00:00.000Z',
            endTime: '2026-10-22T10:30:00.000Z',
            meetingUrl: 'https://meet.google.com/abc-defg-hij',
          },
        })
        .expect(200);

      expect(res.body.received).toBe(true);
    });

    it('processes BOOKING_CANCELLED event and stores cancellation reason', async () => {
      const cancelledUid = `b_cancel_${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/webhooks/calcom')
        .set('x-cal-signature-256', 'valid_test_signature')
        .send({
          triggerEvent: 'BOOKING_CANCELLED',
          payload: {
            uid: cancelledUid,
            cancellationReason: 'Rescheduling for next milestone phase',
          },
        })
        .expect(200);

      expect(res.body.received).toBe(true);
    });
  });

  describe('Signed Booking Token & Anti-Tampering', () => {
    it('Client A generates signed booking token for Project 1', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects/proj_1/meetings/booking-token')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(201);

      expect(res.body.token).toBeDefined();
      expect(res.body.token).toContain('.');
      expect(res.body.expiresAt).toBeDefined();
      expect(res.body.calUsername).toBeDefined();
      expect(res.body.eventSlug).toBeDefined();
    });

    it('Client B is denied booking token for Project 1 with 404 (Anti-Enumeration)', async () => {
      await request(app.getHttpServer())
        .post('/api/projects/proj_1/meetings/booking-token')
        .set('x-mock-user-id', 'client_b')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(404);
    });

    it('Unauthenticated user is denied booking token with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/projects/proj_1/meetings/booking-token')
        .expect(401);
    });
  });

  describe('Project Meetings Scoped Retrieval', () => {
    it('Client A retrieves meetings for Project 1', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects/proj_1/meetings')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].title).toBeDefined();
      expect(res.body[0].meetingUrl).toBeDefined();
    });

    it('Client B receives 404 on Project 1 meetings (Anti-Enumeration)', async () => {
      await request(app.getHttpServer())
        .get('/api/projects/proj_1/meetings')
        .set('x-mock-user-id', 'client_b')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(404);
    });

    it('Client retrieves user-scoped meetings across assigned projects', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/meetings')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('Unified Project Calendar & Designated Billing Contact Segregation', () => {
    it('Client designated billing contact sees Meetings, Milestones, AND Invoices', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects/proj_1/calendar')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(200);

      expect(res.body.timezone).toBe('Africa/Lagos');
      expect(Array.isArray(res.body.events)).toBe(true);

      const eventTypes = res.body.events.map((e: any) => e.type);
      expect(eventTypes).toContain('MEETING');
      expect(eventTypes).toContain('MILESTONE');
      expect(eventTypes).toContain('INVOICE');

      const invoiceEvent = res.body.events.find((e: any) => e.type === 'INVOICE');
      expect(invoiceEvent.metadata.invoiceNumber).toBeDefined();
      expect(invoiceEvent.metadata.totalAmount).toBeDefined();
    });

    it('Client ordinary collaborator (non-billing) sees Meetings and Milestones, but ZERO Invoices', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects/proj_1/calendar')
        .set('x-mock-user-id', 'client_collaborator')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(200);

      expect(Array.isArray(res.body.events)).toBe(true);
      const eventTypes = res.body.events.map((e: any) => e.type);

      expect(eventTypes).toContain('MEETING');
      expect(eventTypes).toContain('MILESTONE');
      // STRICT PRIVACY ENFORCEMENT: invoices must be excluded
      expect(eventTypes).not.toContain('INVOICE');
    });

    it('Client B receives 404 on Project 1 calendar (Anti-Enumeration)', async () => {
      await request(app.getHttpServer())
        .get('/api/projects/proj_1/calendar')
        .set('x-mock-user-id', 'client_b')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(404);
    });
  });

  describe('Owner Meeting & Master Calendar Administration', () => {
    it('Owner can view all client meetings globally', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/meetings')
        .set('x-mock-user-id', 'owner_1')
        .set('x-mock-role', 'Owner')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-mfa', 'true')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].client).toBeDefined();
      expect(res.body[0].project).toBeDefined();
    });

    it('Owner can view master aggregated calendar across all client projects', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/calendar')
        .set('x-mock-user-id', 'owner_1')
        .set('x-mock-role', 'Owner')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-mfa', 'true')
        .expect(200);

      expect(res.body.timezone).toBe('Africa/Lagos');
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.body.events.length).toBeGreaterThan(0);
    });

    it('Client is forbidden from accessing Owner meeting management (403)', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/meetings')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(403);
    });
  });
});
