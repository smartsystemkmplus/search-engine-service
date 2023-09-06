import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class SearchDto {
  @IsString()
  @IsNotEmpty()
  search: string;

  @IsNumber()
  @IsNotEmpty()
  limit: number;
}
