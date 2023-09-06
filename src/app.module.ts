import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RESTSearchController } from './api/http/rest';
import { SearchUsecaseModule } from './usecase/search/search-usecase.module';
import { DBSequelizeModule } from './framework/db/sequelize.module';
import { ConfigModule } from '@nestjs/config';
import { kmsMiddleware } from './middlewares';
import TokenManager from './common/helpers/jwt';
import { UserInfoRepository } from './repository/user-info-repository.service';

@Module({
  imports: [
    // CONFIG
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    // DATA PROVIDER
    DBSequelizeModule,

    // USECASES
    SearchUsecaseModule,
  ],
  providers: [TokenManager, UserInfoRepository],
  controllers: [RESTSearchController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(kmsMiddleware).forRoutes('*');
  }
}
