import { Transport, ClientProviderOptions } from '@nestjs/microservices';

export const MICRO_SERVICES: Record<string, ClientProviderOptions> = {
  RATE: {
    name: 'RATE_SERVICE',
    transport: Transport.TCP,
    options: { host: 'localhost', port: 3000 },
  },
  BALANCE: {
    name: 'BALANCE_SERVICE',
    transport: Transport.TCP,
    options: { host: 'localhost', port: 3001 }, // Adjust if needed
  },
};
