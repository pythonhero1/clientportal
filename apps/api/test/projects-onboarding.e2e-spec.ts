import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Projects, Onboarding & Documents (e2e)', () => {
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

  describe('Client Overview & No-Project Empty State', () => {
    it('/api/client/overview returns hasActiveProject: true and scoped data for Client A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/overview')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(200);

      expect(res.body.hasActiveProject).toBe(true);
      expect(res.body.activeProject).toBeDefined();
      expect(res.body.activeProject.id).toBe('proj_1');
      expect(res.body.websites).toBeInstanceOf(Array);
      expect(res.body.onboarding).toBeDefined();
    });

    it('/api/client/overview returns hasActiveProject: false for unassigned Client C (Screen 18)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/overview')
        .set('x-mock-user-id', 'client_c')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(200);

      expect(res.body.hasActiveProject).toBe(false);
      expect(res.body.activeProject).toBeUndefined();
    });
  });

  describe('Anti-Enumeration and Project Workspace Isolation', () => {
    it('Client A can access Project 1 workspace', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects/proj_1/workspace')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(200);

      expect(res.body.project.id).toBe('proj_1');
      expect(res.body.milestones).toBeInstanceOf(Array);
      expect(res.body.websites).toBeInstanceOf(Array);
      expect(res.body.documents).toBeInstanceOf(Array);
    });

    it('Client B is denied access to Project 1 with 404 (Anti-Enumeration)', async () => {
      await request(app.getHttpServer())
        .get('/api/projects/proj_1')
        .set('x-mock-user-id', 'client_b')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(404);
    });

    it('Client B is denied access to Project 1 workspace with 404', async () => {
      await request(app.getHttpServer())
        .get('/api/projects/proj_1/workspace')
        .set('x-mock-user-id', 'client_b')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(404);
    });
  });

  describe('Onboarding & Questionnaire Autosave', () => {
    it('Client A can autosave questionnaire draft', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/projects/proj_1/onboarding/questionnaire/draft')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .send({
          responses: {
            businessName: 'Acme Global',
            goals: 'Modern customer experience',
          },
        })
        .expect(200);

      expect(res.body.status).toBe('SAVED');
      expect(res.body.lastSavedAt).toBeDefined();
    });

    it('Client A can submit completed questionnaire', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects/proj_1/onboarding/questionnaire/submit')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .send({
          responses: {
            businessName: 'Acme Global',
            goals: 'Modern customer experience',
            targetAudience: 'Global B2B partners',
          },
        })
        .expect(201);

      expect(res.body.status).toBe('SUBMITTED');
    });

    it('Zero Password Mandate: Submitting passwords in credential status is rejected with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/projects/proj_1/onboarding/credentials/confirm-shared')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .send({
          platformName: 'Shopify Admin',
          method: 'COLLABORATOR_INVITE',
          password: 'SecretPassword123!',
        })
        .expect(400);
    });

    it('Client A can record legitimate collaborator invite status', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects/proj_1/onboarding/credentials/confirm-shared')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .send({
          platformName: 'Shopify Admin',
          method: 'COLLABORATOR_INVITE',
          instructions: 'Sent collaborator invite to developer@oderindestephen.com',
        })
        .expect(201);

      expect(res.body.platformName).toBe('Shopify Admin');
      expect(res.body.status).toBe('INVITATION_SENT');
    });
  });

  describe('Google Drive Document Link Security', () => {
    it('Rejects non-Google Drive URLs with 400 (SSRF/Phishing defense)', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/projects/proj_1/documents')
        .set('x-mock-user-id', 'owner')
        .set('x-mock-role', 'Owner')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-mfa', 'true')
        .send({
          title: 'Suspicious Document',
          driveUrl: 'https://malicious-phishing-site.com/fake-doc',
          category: 'SPECIFICATION',
        })
        .expect(400);
    });

    it('Accepts valid Google Drive URLs', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/projects/proj_1/documents')
        .set('x-mock-user-id', 'owner')
        .set('x-mock-role', 'Owner')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-mfa', 'true')
        .send({
          title: 'Creative Brief V1',
          driveUrl: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
          category: 'BRIEF',
        })
        .expect(201);

      expect(res.body.title).toBe('Creative Brief V1');
    });
  });

  describe('Milestone Deliverable Approvals', () => {
    it('Designated approver can approve milestone deliverable', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects/proj_1/milestones/ms_proj_1_2/approve')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(201);

      expect(res.body.status).toBe('APPROVED');
    });
  });

  describe('Owner Kickoff Approval', () => {
    it('Owner approves kickoff, transitioning project to ACTIVE', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/projects/proj_1/kickoff/approve')
        .set('x-mock-user-id', 'owner')
        .set('x-mock-role', 'Owner')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-mfa', 'true')
        .send({
          notes: 'All discovery requirements confirmed. Proceeding to design.',
        })
        .expect(201);

      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.kickoffApprovedAt).toBeDefined();
    });
  });
});
