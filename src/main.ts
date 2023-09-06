import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger();
  const restApp = await NestFactory.create(AppModule);
  const configService = restApp.get(ConfigService);
  await restApp.listen(configService.getOrThrow('PORT'), '0.0.0.0', () =>
    logger.log(`Server running at ${configService.getOrThrow('PORT')}`),
  );
}
bootstrap();
