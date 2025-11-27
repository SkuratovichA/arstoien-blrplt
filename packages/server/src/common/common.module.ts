import { Global, Module } from '@nestjs/common';
import { LockService, S3Service } from '@common/services';

/**
 * CommonModule - Global module providing shared services
 *
 * @Global decorator makes these services available to all modules
 * without needing explicit imports
 */
@Global()
@Module({
  providers: [S3Service, LockService],
  exports: [S3Service, LockService],
})
export class CommonModule {}
