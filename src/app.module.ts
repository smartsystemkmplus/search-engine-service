import { Module } from '@nestjs/common';
import { RESTSearchController } from './api/http/rest';
import { GRPCSearchController } from './api/http/grpc';
import { SearchUsecaseModule } from './usecase/search/search-usecase.module';
import { DBSequelizeModule } from './framework/db/sequelize.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // CONFIG
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // DATA PROVIDER
    DBSequelizeModule,

    // USECASES
    SearchUsecaseModule
  ],
  controllers: [
    RESTSearchController,
    GRPCSearchController
  ],
})
export class AppModule { }
