import { Injectable } from '@nestjs/common';
import { LoggerService } from '@app/shared/logger/logger.service'; // Import the LoggerService

@Injectable()
export class ErrorHandlingService {
  constructor(private readonly logger: LoggerService) {} // Inject the LoggerService

  handleError(
    error: Error,
    throwError: boolean = false,
    customMessage: string = '',
  ): void {
    const message = customMessage
      ? `${customMessage}: ${error.message}`
      : error.message;

    this.logger.error(`[ERROR] ${new Date().toISOString()} - ${message}`); // Use logger for error logging

    if (throwError) {
      throw error; // Re-throw the exact error passed to the method
    }
  }
}
