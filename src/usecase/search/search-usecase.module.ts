import { Module } from '@nestjs/common';
import { SearchUsecase } from './search-usecase.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { ISearchUsecase } from 'src/domain/usecase/search';

@Module({
  imports: [RepositoryModule],
  providers: [
    {
      provide: ISearchUsecase,
      useClass: SearchUsecase,
    },
  ],
  exports: [ISearchUsecase],
})
export class SearchUsecaseModule {}
