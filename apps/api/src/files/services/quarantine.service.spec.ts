import { describe, it, expect, beforeEach } from 'vitest';
import { QuarantineService, MAX_FILE_SIZE_BYTES } from './quarantine.service.js';
import { ConfigService } from '@nestjs/config';
import { FileCategory, ScanStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('QuarantineService', () => {
  let service: QuarantineService;

  beforeEach(() => {
    const configService = new ConfigService();
    service = new QuarantineService(configService);
  });

  describe('validateFileSize', () => {
    it('accepts valid sizes <= 500,000,000 bytes', () => {
      expect(() => service.validateFileSize(100)).not.toThrow();
      expect(() => service.validateFileSize(MAX_FILE_SIZE_BYTES)).not.toThrow();
      expect(() => service.validateFileSize(BigInt(MAX_FILE_SIZE_BYTES))).not.toThrow();
    });

    it('rejects 0 bytes or negative sizes', () => {
      expect(() => service.validateFileSize(0)).toThrow(BadRequestException);
      expect(() => service.validateFileSize(-10)).toThrow(BadRequestException);
    });

    it('strictly rejects files exceeding 500,000,000 bytes', () => {
      expect(() => service.validateFileSize(MAX_FILE_SIZE_BYTES + 1)).toThrow(BadRequestException);
      expect(() => service.validateFileSize(BigInt(MAX_FILE_SIZE_BYTES + 1000))).toThrow(BadRequestException);
    });
  });

  describe('validateCategoryAndExtension', () => {
    it('accepts all 7 approved categories with valid extensions', () => {
      expect(service.validateCategoryAndExtension(FileCategory.IMAGES, 'png')).toBe('png');
      expect(service.validateCategoryAndExtension(FileCategory.DOCUMENTS, 'PDF')).toBe('pdf');
      expect(service.validateCategoryAndExtension(FileCategory.SPREADSHEETS, '.xlsx')).toBe('xlsx');
      expect(service.validateCategoryAndExtension(FileCategory.DESIGN_FILES, 'psd')).toBe('psd');
    });

    it('rejects unapproved extensions or wrong category associations', () => {
      expect(() => service.validateCategoryAndExtension(FileCategory.DOCUMENTS, 'exe')).toThrow(
        BadRequestException,
      );
      expect(() => service.validateCategoryAndExtension(FileCategory.IMAGES, 'mp4')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('determineCategory', () => {
    it('correctly maps extensions to categories', () => {
      expect(service.determineCategory('jpg')).toBe(FileCategory.IMAGES);
      expect(service.determineCategory('pdf')).toBe(FileCategory.DOCUMENTS);
      expect(service.determineCategory('csv')).toBe(FileCategory.SPREADSHEETS);
      expect(service.determineCategory('svg')).toBe(FileCategory.DESIGN_FILES);
      expect(service.determineCategory('zip')).toBe(FileCategory.ARCHIVES);
      expect(service.determineCategory('mp4')).toBe(FileCategory.VIDEO);
      expect(service.determineCategory('wav')).toBe(FileCategory.AUDIO);
    });

    it('rejects unsupported extensions', () => {
      expect(() => service.determineCategory('exe')).toThrow(BadRequestException);
      expect(() => service.determineCategory('sh')).toThrow(BadRequestException);
      expect(() => service.determineCategory('bat')).toThrow(BadRequestException);
    });
  });

  describe('verifyMagicBytes', () => {
    it('rejects SVGs containing embedded executable scripts', async () => {
      const maliciousSvg = Buffer.from('<svg><script>alert("XSS")</script></svg>');
      await expect(service.verifyMagicBytes(maliciousSvg, 'svg')).rejects.toThrow(BadRequestException);
    });

    it('accepts safe SVGs', async () => {
      const safeSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
      await expect(service.verifyMagicBytes(safeSvg, 'svg')).resolves.toBe(true);
    });
  });

  describe('scanFile', () => {
    it('returns clean scan status in local environment for valid size', async () => {
      const result = await service.scanFile('quarantine/test-key', 5000);
      expect(result.status).toBe(ScanStatus.CLEAN);
      expect(result.result).toContain('Quarantine inspection passed');
    });
  });
});
