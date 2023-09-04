import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

require('dotenv').config();

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:3000',
      package: 'search',
      protoPath: join(__dirname, 'api/contract/search.proto'),
    },
  });
  app.listen();

  const restApp = await NestFactory.create(AppModule)
  restApp.listen(3000)
}
bootstrap();
