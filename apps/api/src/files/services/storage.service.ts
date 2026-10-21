import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly isLocalOrTest: boolean;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID') || 'dev-key';
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || 'dev-secret';
    this.bucketName = this.configService.get<string>('S3_BUCKET') || 'client-portal-files';
    this.isLocalOrTest = !this.configService.get<string>('AWS_ACCESS_KEY_ID') || !!endpoint;

    this.s3Client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: !!endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Generates a presigned upload URL for direct S3 upload (e.g. into quarantine prefix).
   * Ensures the Node server process never buffers 500 MB in memory.
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
      this.logger.error(`Failed to generate presigned upload URL for key: ${key}`, error);
      // For local development without real S3 credentials, provide a mock signed url
      if (this.isLocalOrTest) {
        return `http://localhost:3000/mock-s3-upload/${encodeURIComponent(key)}`;
      }
      throw error;
    }
  }

  /**
   * Generates a short-lived presigned download URL.
   * Crucially sets Content-Disposition: attachment for downloads (especially SVGs/HTML)
   * to guarantee no scripts execute in the portal origin.
   */
  async getPresignedDownloadUrl(
    key: string,
    originalFileName: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    try {
      const encodedFilename = encodeURIComponent(originalFileName);
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
      this.logger.error(`Failed to generate presigned download URL for key: ${key}`, error);
      if (this.isLocalOrTest) {
        return `http://localhost:3000/mock-s3-download/${encodeURIComponent(key)}`;
      }
      throw error;
    }
  }

  /**
   * Checks the actual stored object size and metadata directly in S3.
   * Used on completion to verify file size <= 500,000,000 bytes.
   */
  async getObjectMetadata(key: string): Promise<{ contentLength: number; contentType?: string; eTag?: string } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return {
        contentLength: response.ContentLength ?? 0,
        contentType: response.ContentType,
        eTag: response.ETag,
      };
    } catch (error: any) {
      if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) {
        return null;
      }
      if (this.isLocalOrTest) {
        // Return dummy metadata in mock dev mode if object doesn't exist
        this.logger.warn(`S3 HeadObject for ${key} failed in local mode, returning mock metadata.`);
        return { contentLength: 1024, contentType: 'application/octet-stream' };
      }
      this.logger.error(`Failed to get object metadata for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Promotes an object from quarantine key to permanent deliverable storage key.
   */
  async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      });
      await this.s3Client.send(command);
    } catch (error) {
      if (this.isLocalOrTest) {
        this.logger.warn(`S3 CopyObject in local mode simulated: ${sourceKey} -> ${destinationKey}`);
        return;
      }
      this.logger.error(`Failed to copy S3 object from ${sourceKey} to ${destinationKey}`, error);
      throw error;
    }
  }

  /**
   * Permanently deletes a single object key from S3.
   */
  async deleteObject(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
    } catch (error) {
      if (this.isLocalOrTest) {
        this.logger.warn(`S3 DeleteObject in local mode simulated: ${key}`);
        return;
      }
      this.logger.error(`Failed to delete S3 object key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Permanently deletes multiple version object keys from S3 (used during permanent deletion).
   */
  async deleteObjects(keys: string[]): Promise<void> {
    if (!keys || keys.length === 0) return;
    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map((Key) => ({ Key })),
          Quiet: true,
        },
      });
      await this.s3Client.send(command);
    } catch (error) {
      if (this.isLocalOrTest) {
        this.logger.warn(`S3 DeleteObjects in local mode simulated for ${keys.length} keys`);
        return;
      }
      this.logger.error(`Failed to delete S3 objects`, error);
      throw error;
    }
  }
}
