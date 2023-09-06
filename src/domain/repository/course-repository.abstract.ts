import { Row } from '../entity';
export abstract class ICourseRepository {
  abstract getCourseByQuery(search: string): Promise<Row[]>;
}
