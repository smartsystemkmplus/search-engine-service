import { Row } from '../entity';
export abstract class IDocumentRepository {
  abstract getDocumentByQuery(search: string): Promise<Row[]>;
}
