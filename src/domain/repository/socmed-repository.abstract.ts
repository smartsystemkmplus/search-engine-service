import { Row } from '../entity';
export abstract class IProfileRepository {
  abstract getProfileByQuery(search: string): Promise<Row[]>;
}
