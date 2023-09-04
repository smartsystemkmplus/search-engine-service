import { Controller, Get, UseInterceptors, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SearchDto } from 'src/domain/dto/search';
import { ISearchUsecase } from 'src/domain/usecase/search';
import { FormatResponseInterceptor } from 'src/common/interceptor';
import { AuthFirebaseTokenGuard } from 'src/common/guard/auth';

@UseInterceptors(FormatResponseInterceptor)
@UseGuards(AuthFirebaseTokenGuard)
@Controller('/search')
export class RESTSearchController {
  constructor(private readonly SearchUsecase: ISearchUsecase) {}

  @Get()
  @GrpcMethod('SearchService', 'Search')
  get(): object {
    try {
      return this.SearchUsecase.search(new SearchDto());
    } catch (error) {
      console.log(error);
    }
  }
}
