import { Module } from '@nestjs/common';
import { ErrorHandlingService } from './error-handling.service';

@Module({
  providers: [ErrorHandlingService]
})
export class ErrorHandlingModule {}
