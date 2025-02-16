import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { FileManagerModule } from './file-manager/file-manager.module';
import { LoggerModule } from './logger/logger.module';
import { ErrorHandlingModule } from './error-handling/error-handling.module';
import { CurrencyConversionUtil } from './utils/currency-conversion.util';
import { HttpModule } from '@nestjs/axios'; // Import HttpModule

@Module({
  providers: [SharedService, CurrencyConversionUtil], // Provide SharedService and CurrencyConversionUtil
  exports: [SharedService, FileManagerModule, CurrencyConversionUtil], // Export SharedService and FileManagerModule
  imports: [FileManagerModule, LoggerModule, ErrorHandlingModule, HttpModule], // Import HttpModule to use HttpService
})
export class SharedModule {}
