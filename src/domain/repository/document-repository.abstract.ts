import { Row } from '../entity';
export abstract class IDocumentRepository {
  abstract get(): Promise<Row[]>;
}
