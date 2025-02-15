import { Transport, ClientProviderOptions } from '@nestjs/microservices';
import * as dotenv from 'dotenv';

dotenv.config();

export const MICRO_SERVICES: Record<string, ClientProviderOptions> = {
  RATE: {
    name: process.env.RATE_SERVICE_NAME || 'RATE_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.RATE_SERVICE_HOST || 'localhost',
      port: Number(process.env.RATE_SERVICE_PORT) || 3000,
    },
  },
  BALANCE: {
    name: process.env.BALANCE_SERVICE_NAME || 'BALANCE_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.BALANCE_SERVICE_HOST || 'localhost',
      port: Number(process.env.BALANCE_SERVICE_PORT) || 3001,
    },
  },
};
