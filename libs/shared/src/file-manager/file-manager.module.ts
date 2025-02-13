// apps/shared/src/file-manager/file-manager.module.ts
import { Module } from '@nestjs/common';
import { FileManagerService } from './file-manager.service';

@Module({
  providers: [FileManagerService],
  exports: [FileManagerService], // Export the FileManagerService
})
export class FileManagerModule {}
