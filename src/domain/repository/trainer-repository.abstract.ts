import { Row } from '../entity';
export abstract class ITrainerRepository {
  abstract getTrainerByQuery(search: string): Promise<Row[]>;
}
