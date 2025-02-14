import { Module } from '@nestjs/common';
import { ErrorHandlingService } from './error-handling.service';
import { LoggerModule } from '@app/shared/logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [ErrorHandlingService],
  exports: [ErrorHandlingService], // Make sure it's exported
})
export class ErrorHandlingModule {}
