import { SearchDto } from "../../dto/search/search.dto";
import { Row } from "../../entity";

export abstract class ISearchUsecase {
  abstract search(data: SearchDto): Promise<Row[]>
}