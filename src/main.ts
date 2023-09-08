import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger();
  const restApp = await NestFactory.create(AppModule, { cors: true });
  const configService = restApp.get(ConfigService);
  const corsOptions = {
    credentials: true,
    // origin: function (origin, callback) {
    //   if (whitelist.indexOf(origin) !== -1) {
    //     callback(null, true);
    //   } else {
    //     callback(new Error("Not allowed by CORS"));
    //   }
    // },
    origin: true,
  };

  restApp.enableCors(corsOptions);
  restApp.use(cookieParser());
  await restApp.listen(configService.getOrThrow('PORT'), '0.0.0.0', () =>
    logger.log(`Server running at ${configService.getOrThrow('PORT')}`),
  );
}
bootstrap();
