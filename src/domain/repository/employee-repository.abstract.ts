import { Row } from '../entity';
export abstract class IEmployeeRepository {
  abstract getEmployeeByQuery(search: string): Promise<Row[]>;
  abstract getEmployeeByQueryV2(search: string): Promise<Row[]>;
}
