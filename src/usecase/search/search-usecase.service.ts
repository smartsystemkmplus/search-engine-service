import { Injectable } from "@nestjs/common"
import { SearchDto } from "src/domain/dto/search";
import { Row } from "src/domain/entity";
import { IEmployeeRepository } from "src/domain/repository";
import { ISearchUsecase } from "src/domain/usecase/search";

@Injectable()
export class SearchUsecase implements ISearchUsecase {

  constructor(
    private EmployeeRepo: IEmployeeRepository
  ) { }

  async search(data: SearchDto): Promise<Row[]> {
    return this.EmployeeRepo.get(data.query)
  }
}
