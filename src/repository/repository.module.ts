import { Module } from '@nestjs/common';
import { EmployeeRepository } from 'src/repository/employee-repository.service';
import { IEmployeeRepository } from 'src/domain/repository';

@Module({
  providers: [
    {
      provide: IEmployeeRepository,
      useClass: EmployeeRepository,
    },
  ],
  exports: [IEmployeeRepository],
})
export class RepositoryModule {}
