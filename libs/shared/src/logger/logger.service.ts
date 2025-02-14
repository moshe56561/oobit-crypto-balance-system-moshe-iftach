import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = String(date.getFullYear()).slice(2); // Get last 2 digits of the year
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} - Time: ${hours}:${minutes}:${seconds}`;
  }

  log(message: string): void {
    const formattedDate = this.formatDate(new Date());
    console.log(`[LOG] ${formattedDate} - ${message}`);
  }

  error(message: string): void {
    const formattedDate = this.formatDate(new Date());
    console.error(`[ERROR] ${formattedDate} - ${message}`);
  }
}
