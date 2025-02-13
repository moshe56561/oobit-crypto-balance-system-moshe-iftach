import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { FileManagerModule } from './file-manager/file-manager.module';
import { LoggerModule } from './logger/logger.module';
import { ErrorHandlingModule } from './error-handling/error-handling.module';

@Module({
  providers: [SharedService], // Only provide SharedService
  exports: [SharedService, FileManagerModule], // Export SharedService and FileManagerModule
  imports: [FileManagerModule, LoggerModule, ErrorHandlingModule],
})
export class SharedModule {}
