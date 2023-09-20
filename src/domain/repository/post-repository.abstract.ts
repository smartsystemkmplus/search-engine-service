import { Row } from '../entity';
export abstract class IPostRepository {
  abstract getPostByQuery(search: string): Promise<Row[]>;
}
