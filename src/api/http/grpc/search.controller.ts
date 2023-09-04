import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices'
import { SearchDto } from 'src/domain/dto/search';
import { Row } from 'src/domain/entity';
import { ISearchUsecase } from 'src/domain/usecase/search';

@Controller('/search')
export class GRPCSearchController {
  constructor(private readonly SearchUsecase: ISearchUsecase) { }

  @GrpcMethod("SearchService", "Search")
  async get(): Promise<Object> {
    try {
      const response: Row[] = await this.SearchUsecase.search(new SearchDto())
      return { response };
    } catch (error) {
      console.log(error)
    }
  }
}
