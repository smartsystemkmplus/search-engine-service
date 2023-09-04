import { Row } from '../entity';
export abstract class ICourseRepository {
  abstract get(): Promise<Row[]>;
}
