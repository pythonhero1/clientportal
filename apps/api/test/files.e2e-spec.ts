import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { FileCategory, FileVisibility } from '@prisma/client';

describe('Files, Version Review & Lifecycle (e2e)', () => {
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

  describe('Upload Initiation & Validation (500 MB & 7 Categories)', () => {
    it('initiates upload successfully for approved category and size <= 500MB', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects/proj_1/files/upload-initiate')
        .set('x-mock-user-id', 'owner_1')
        .set('x-mock-role', 'Owner')
        .set('x-mock-status', 'ACTIVE')
        .set('x-mock-mfa', 'true')
        .send({
          name: 'Hero Section Design',
          category: FileCategory.DESIGN_FILES,
          fileName: 'Hero_Design_v1.psd',
          fileExtension: 'psd',
          byteSize: 45_000_000, // 45 MB
          mimeType: 'image/vnd.adobe.photoshop',
          visibility: FileVisibility.SHARED,
        })
        .expect(201);

      expect(res.body.uploadUrl).toBeDefined();
      expect(res.body.quarantineKey).toContain('quarantine/projects/proj_1');
      expect(res.body.fileId).toBeDefined();
      expect(res.body.versionId).toBeDefined();
    });

    it('rejects upload initiation if size exceeds 500,000,000 bytes', async () => {
      await request(app.getHttpServer())
        .post('/api/projects/proj_1/files/upload-initiate')
        .set('x-mock-user-id', 'owner_1')
        .set('x-mock-role', 'Owner')
        .set('x-mock-status', 'ACTIVE')
        .send({
          name: 'Huge Video',
          category: FileCategory.VIDEO,
          fileName: 'huge.mp4',
          fileExtension: 'mp4',
          byteSize: 500_000_001, // 500 MB + 1 byte
          mimeType: 'video/mp4',
        })
        .expect(400);
    });

    it('rejects upload initiation for unapproved extension', async () => {
      await request(app.getHttpServer())
        .post('/api/projects/proj_1/files/upload-initiate')
        .set('x-mock-user-id', 'owner_1')
        .set('x-mock-role', 'Owner')
        .set('x-mock-status', 'ACTIVE')
        .send({
          name: 'Malicious Executable',
          category: FileCategory.DOCUMENTS,
          fileName: 'payload.exe',
          fileExtension: 'exe',
          byteSize: 1024,
          mimeType: 'application/x-msdownload',
        })
        .expect(400);
    });

    it('rejects Client trying to set INTERNAL visibility (Owner only)', async () => {
      await request(app.getHttpServer())
        .post('/api/projects/proj_1/files/upload-initiate')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .send({
          name: 'Secret Client File',
          category: FileCategory.DOCUMENTS,
          fileName: 'notes.txt',
          fileExtension: 'txt',
          byteSize: 100,
          mimeType: 'text/plain',
          visibility: FileVisibility.INTERNAL,
        })
        .expect(403);
    });
  });

  describe('Anti-Enumeration & Cross-Client Isolation', () => {
    it('returns 404 Not Found for non-existent file or foreign project query', async () => {
      await request(app.getHttpServer())
        .get('/api/projects/proj_1/files/non_existent_file_id')
        .set('x-mock-user-id', 'client_a')
        .set('x-mock-role', 'Client')
        .set('x-mock-status', 'ACTIVE')
        .expect(404);
    });
  });
});
