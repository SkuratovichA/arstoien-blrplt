import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { AppConfig } from '../../config/app.config';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

/**
 * S3Service - File upload/download service using AWS SDK v3
 * Works with both AWS S3 and MinIO (S3-compatible storage)
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client?: S3Client;
  private readonly bucket?: string;
  private readonly region?: string;
  private readonly endpoint?: string;
  private readonly maxFileSize: number;

  constructor(private configService: ConfigService) {
    const appConfig = this.configService.get<AppConfig>('app')!;
    this.maxFileSize = appConfig.upload.maxFileSize;
    const s3Config = appConfig.s3;

    if (!s3Config) {
      this.logger.warn('S3 configuration not found. File uploads will be disabled.');
      return;
    }

    this.bucket = s3Config.bucket;
    this.region = s3Config.region;
    this.endpoint = s3Config.endpoint;

    // Configure S3 client (works with both AWS S3 and MinIO)
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint, // For MinIO: http://localhost:9000
      credentials: {
        accessKeyId: s3Config.accessKey,
        secretAccessKey: s3Config.secretKey,
      },
      forcePathStyle: !!this.endpoint, // Required for MinIO
    });

    this.logger.log(`S3Service initialized: bucket=${this.bucket}, region=${this.region}`);
  }

  /**
   * Upload a file to S3/MinIO
   * @param file - File buffer or stream
   * @param options - Upload options
   * @returns Upload result with key and URL
   */
  async upload(
    file: Buffer,
    options: {
      filename: string;
      mimetype: string;
      folder?: string;
      acl?: 'private' | 'public-read';
    }
  ): Promise<UploadResult> {
    if (!this.s3Client || !this.bucket) {
      throw new Error('S3 service not configured. Please set S3 environment variables.');
    }

    // Generate unique key
    const extension = this.getFileExtension(options.filename);
    const uniqueFilename = `${randomUUID()}${extension}`;
    const key = options.folder ? `${options.folder}/${uniqueFilename}` : uniqueFilename;

    // Upload to S3
    // Note: ACL parameter removed as modern S3 buckets use bucket policies instead
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: options.mimetype,
    });

    await this.s3Client.send(command);

    // Generate URL
    const url = this.getPublicUrl(key);

    this.logger.log(`File uploaded: ${key}`);

    return {
      key,
      url,
      bucket: this.bucket,
    };
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: Array<{
      buffer: Buffer;
      filename: string;
      mimetype: string;
    }>,
    options: {
      folder?: string;
      acl?: 'private' | 'public-read';
    }
  ): Promise<UploadResult[]> {
    const uploads = files.map((file) =>
      this.upload(file.buffer, {
        filename: file.filename,
        mimetype: file.mimetype,
        folder: options.folder,
        acl: options.acl,
      })
    );

    return Promise.all(uploads);
  }

  /**
   * Delete a file from S3/MinIO
   * @param key - S3 object key
   */
  async delete(key: string): Promise<void> {
    if (!this.s3Client || !this.bucket) {
      throw new Error('S3 service not configured. Please set S3 environment variables.');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);

    this.logger.log(`File deleted: ${key}`);
  }

  /**
   * Delete multiple files
   */
  async deleteMultiple(keys: string[]): Promise<void> {
    const deletes = keys.map((key) => this.delete(key));
    await Promise.all(deletes);
  }

  /**
   * Get a signed URL for temporary access to a private file
   * @param key - S3 object key
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client || !this.bucket) {
      throw new Error('S3 service not configured. Please set S3 environment variables.');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Check if a file exists
   * @param key - S3 object key
   * @returns True if file exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.s3Client || !this.bucket) {
      throw new Error('S3 service not configured. Please set S3 environment variables.');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if ((error as { name?: string }).name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get public URL for a file
   * @param key - S3 object key
   * @returns Public URL
   */
  getPublicUrl(key: string): string {
    if (this.endpoint) {
      // MinIO or custom S3 endpoint
      return `${this.endpoint}/${this.bucket}/${key}`;
    }

    // AWS S3
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Validate file before upload
   * @param file - File to validate
   * @param options - Validation options
   * @throws Error if validation fails
   */
  validateFile(
    file: {
      size: number;
      mimetype: string;
      filename: string;
    },
    options: FileValidationOptions = {}
  ): void {
    const {
      maxSizeBytes = this.maxFileSize,
      allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    } = options;

    // Check file size
    if (file.size > maxSizeBytes) {
      throw new Error(`File too large. Maximum size: ${this.formatBytes(maxSizeBytes)}`);
    }

    // Check MIME type
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }

    // Check file extension
    const extension = this.getFileExtension(file.filename).toLowerCase();
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
      throw new Error(
        `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`
      );
    }
  }

  /**
   * Validate image dimensions (requires image-size package or similar)
   * @param _buffer - Image buffer
   * @param _options - Dimension constraints
   */
  async validateImageDimensions(
    _buffer: Buffer,
    _options: {
      minWidth?: number;
      maxWidth?: number;
      minHeight?: number;
      maxHeight?: number;
    }
  ): Promise<void> {
    // TODO: Install 'image-size' package and implement dimension validation
    // const dimensions = sizeOf(_buffer);
    // if (options.minWidth && dimensions.width < options.minWidth) {
    //   throw new Error(`Image width must be at least ${options.minWidth}px`);
    // }
    // ... etc

    this.logger.debug('Image dimension validation not implemented yet');
  }

  // Helper methods

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
