import {
  Controller,
  Get,
  UseInterceptors,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SearchDto } from 'src/domain/dto/search';
import { ISearchUsecase } from 'src/domain/usecase/search';
import { FormatResponseInterceptor } from 'src/common/interceptor';
import { AuthFirebaseTokenGuard } from 'src/common/guard/auth';
@UseInterceptors(FormatResponseInterceptor)
@UseGuards(AuthFirebaseTokenGuard)
@Controller('/spotlight')
export class RESTSearchController {
  constructor(private readonly SearchUsecase: ISearchUsecase) {}

  @Get()
  async get(@Query('search') search: string): Promise<object> {
    // Ensure it returns a Promise
    try {
      const searchDto = new SearchDto();
      searchDto.search = search; // Pass the query parameter to SearchDto
      return await this.SearchUsecase.search(searchDto); // Await the result
    } catch (error) {
      console.error(error); // Use console.error for error logging
      throw error; // Re-throw the error to propagate it
    }
  }
}
