import { Module } from '@nestjs/common';
import { EmployeeRepository } from 'src/repository/employee-repository.service';
import {
  ICourseRepository,
  IDocumentRepository,
  IEmployeeRepository,
  ITrainerRepository,
  IUserInfoRepository,
} from 'src/domain/repository';
import { CourseRepository } from './course-repository.service';
import { DocumentRepository } from './document-repository.service';
import { TrainerRepository } from './trainer-repository.service';
import { StorageModule } from 'src/framework/storage/storage.module';
import { UserInfoRepository } from './user-info-repository.service';

@Module({
  imports: [StorageModule],
  providers: [
    {
      provide: IEmployeeRepository,
      useClass: EmployeeRepository,
    },
    {
      provide: ICourseRepository,
      useClass: CourseRepository,
    },
    {
      provide: IDocumentRepository,
      useClass: DocumentRepository,
    },
    {
      provide: ITrainerRepository,
      useClass: TrainerRepository,
    },
    {
      provide: IUserInfoRepository,
      useClass: UserInfoRepository,
    },
  ],
  exports: [
    IEmployeeRepository,
    ICourseRepository,
    IDocumentRepository,
    ITrainerRepository,
    IUserInfoRepository,
  ],
})
export class RepositoryModule {}
