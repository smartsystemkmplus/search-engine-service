import { Row } from '../entity';
export abstract class IEmployeeRepository {
  abstract get(query: string): Promise<Row[]>;
}
