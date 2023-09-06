import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
// import * as Joi from 'joi';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'smartsystem-db-mysql-sgp1-98825-do-user-10048663-0.b.db.ondigitalocean.com',
      port: 25060,
      username: 'doadmin',
      password: 'AVNS__gnVCFUe9556ylpLuHG',
      database: 'defaultdb',
      models: [],
    }),
    // ConfigModule.forRoot({
    //   envFilePath: '.env',
    // }),
  ],
})
export class DBSequelizeModule {}
