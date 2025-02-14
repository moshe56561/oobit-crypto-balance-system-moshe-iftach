import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, ClientsModuleOptions } from '@nestjs/microservices';

@Module({})
export class MicroservicesClientModule {
  static register(options: ClientsModuleOptions): DynamicModule {
    return {
      module: MicroservicesClientModule,
      imports: [ClientsModule.register(options)], // Registers microservice clients dynamically
      exports: [ClientsModule], // Makes clients available to other modules
    };
  }
}
