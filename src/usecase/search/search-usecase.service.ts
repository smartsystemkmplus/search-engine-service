import { Injectable } from '@nestjs/common';
import { SearchDto } from 'src/domain/dto/search';
import { Row } from 'src/domain/entity';
import {
  ICourseRepository,
  IDocumentRepository,
  IEmployeeRepository,
  ITrainerRepository,
  IPostRepository,
  IProfileRepository,
} from 'src/domain/repository';
import { ISearchUsecase } from 'src/domain/usecase/search';

@Injectable()
export class SearchUsecase implements ISearchUsecase {
  constructor(
    private EmployeeRepo: IEmployeeRepository,
    private CourseRepo: ICourseRepository,
    private DocumentRepo: IDocumentRepository,
    private TrainerRepo: ITrainerRepository,
    private PostRepo: IPostRepository,
    private ProfileRepo: IProfileRepository,
  ) {}

  async search(data: SearchDto): Promise<Row[]> {
    const [
      courseData,
      documentData,
      employeeData,
      trainerData,
      postData,
      profileRepo,
    ] = await Promise.all([
      this.CourseRepo.getCourseByQuery(data.search),
      this.DocumentRepo.getDocumentByQuery(data.search),
      this.EmployeeRepo.getEmployeeByQuery(data.search),
      this.TrainerRepo.getTrainerByQuery(data.search),
      this.PostRepo.getPostByQuery(data.search),
      this.ProfileRepo.getProfileByQuery(data.search),
    ]);

    const combinedData = [
      ...profileRepo,
      ...employeeData,
      ...postData,
      ...documentData,
      ...courseData,
      ...trainerData,
    ];

    return combinedData;
  }
}
