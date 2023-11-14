import { Row } from '../entity';
export abstract class ISurveyRepository {
  abstract getSurveyByQuery(search: string): Promise<Row[]>;
}
