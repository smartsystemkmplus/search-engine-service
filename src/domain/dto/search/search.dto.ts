import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class SearchDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsNumber()
  @IsNotEmpty()
  limit: number;
}
