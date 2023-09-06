import { Injectable } from '@nestjs/common';
import { SearchDto } from 'src/domain/dto/search';
import { Row } from 'src/domain/entity';
import {
  ICourseRepository,
  IDocumentRepository,
  IEmployeeRepository,
  ITrainerRepository,
} from 'src/domain/repository';
import { ISearchUsecase } from 'src/domain/usecase/search';

@Injectable()
export class SearchUsecase implements ISearchUsecase {
  constructor(
    private EmployeeRepo: IEmployeeRepository,
    private CourseRepo: ICourseRepository,
    private DocumentRepo: IDocumentRepository,
    private TrainerRepo: ITrainerRepository,
  ) {}

  async search(data: SearchDto): Promise<Row[]> {
    const [courseData, documentData, employeeData, trainerData] =
      await Promise.all([
        this.CourseRepo.getCourseByQuery(data.search),
        this.DocumentRepo.getDocumentByQuery(data.search),
        this.EmployeeRepo.getEmployeeByQuery(data.search),
        this.TrainerRepo.getTrainerByQuery(data.search),
      ]);

    const combinedData = [
      ...employeeData,
      ...courseData,
      ...documentData,
      ...trainerData,
    ];

    return combinedData;
  }
}
