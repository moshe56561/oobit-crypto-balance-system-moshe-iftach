import { Injectable } from '@nestjs/common';

@Injectable()
export class ErrorHandlingService {
  handleError(error: Error): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${error.message}`);
    // You can add more error handling logic here
  }
}
