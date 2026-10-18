import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Auth & Project Data Isolation (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Unauthenticated Access', () => {
    it('/api/projects (GET) rejects unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .get('/api/projects')
        .expect(401);
    });

    it('/api/auth/me (GET) rejects unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('Account Status Gating', () => {
    it('/api/projects (GET) rejects pending client with 403 ACCOUNT_PENDING_APPROVAL', () => {
      return request(app.getHttpServer())
        .get('/api/projects')
        .set('x-mock-user-id', 'client_pending')
        .set('x-mock-status', 'PENDING_APPROVAL')
        .set('x-mock-role', 'Client')
        .expect(403)
        .expect((res: request.Response) => {
          expect(res.body.code).toBe('ACCOUNT_PENDING_APPROVAL');
        });
    });

    it('/api/projects (GET) rejects suspended client with 403 ACCOUNT_SUSPENDED', () => {
      return request(app.getHttpServer())
        .get('/api/projects')
        .set('x-mock-user-id', 'client_suspended')
        .set('x-mock-status', 'SUSPENDED')
        .set('x-mock-role', 'Client')
        .expect(403)
        .expect((res: request.Response) => {
          expect(res.body.code).toBe('ACCOUNT_SUSPENDED');
        });
    });
  });

  describe('Client A vs Client B Data Isolation', () => {
    it('Client A only sees Client A projects and cannot see Client B projects', () => {
      return request(app.getHttpServer())
        .get('/api/projects')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-role', 'Client')
        .expect(200)
        .expect((res: request.Response) => {
          expect(Array.isArray(res.body)).toBe(true);
          const projectIds = res.body.map((p: any) => p.id);
          expect(projectIds).toContain('proj_1');
          expect(projectIds).not.toContain('proj_2');
        });
    });

    it('Client B only sees Client B projects and cannot see Client A projects', () => {
      return request(app.getHttpServer())
        .get('/api/projects')
        .set('x-mock-user-id', 'client_b')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-role', 'Client')
        .expect(200)
        .expect((res: request.Response) => {
          expect(Array.isArray(res.body)).toBe(true);
          const projectIds = res.body.map((p: any) => p.id);
          expect(projectIds).toContain('proj_2');
          expect(projectIds).not.toContain('proj_1');
        });
    });

    it('Client A querying foreign project proj_2 receives 404 (preventing enumeration)', () => {
      return request(app.getHttpServer())
        .get('/api/projects/proj_2')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-role', 'Client')
        .expect(404);
    });

    it('Client B querying foreign project proj_1 receives 404 (preventing enumeration)', () => {
      return request(app.getHttpServer())
        .get('/api/projects/proj_1')
        .set('x-mock-user-id', 'client_b')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-role', 'Client')
        .expect(404);
    });
  });

  describe('Role Boundaries & Owner MFA', () => {
    it('Client attempting Owner activation endpoint receives 403 FORBIDDEN_ROLE', () => {
      return request(app.getHttpServer())
        .post('/api/admin/users/some_user/activate')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-role', 'Client')
        .expect(403)
        .expect((res: request.Response) => {
          expect(res.body.code).toBe('FORBIDDEN_ROLE');
        });
    });

    it('Owner without MFA on privileged endpoint receives 403 OWNER_MFA_REQUIRED', () => {
      return request(app.getHttpServer())
        .post('/api/admin/users/some_user/activate')
        .set('x-mock-user-id', 'owner_1')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-role', 'Owner')
        .set('x-mock-mfa', 'false')
        .expect(403)
        .expect((res: request.Response) => {
          expect(res.body.code).toBe('OWNER_MFA_REQUIRED');
        });
    });

    it('Owner with verified MFA is granted access to privileged activation', () => {
      return request(app.getHttpServer())
        .post('/api/admin/users/some_user/activate')
        .set('x-mock-user-id', 'owner_1')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-role', 'Owner')
        .set('x-mock-mfa', 'true')
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.status).toBe('ACTIVE');
        });
    });
  });
});
