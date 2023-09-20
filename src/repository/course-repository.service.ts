import { Injectable } from '@nestjs/common';
import { Row, RowType } from 'src/domain/entity';
import { ICourseRepository } from 'src/domain/repository';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';

@Injectable()
export class CourseRepository implements ICourseRepository {
  constructor(private sequelize: Sequelize) {}

  async getCourseByQuery(search: string): Promise<Row[]> {
    const formattedQueryParam = `%${search}%`;
    const result = await this.sequelize.query(
      `
      SELECT 
        tc.course_id,
        tc.name,
        tc.type 
      FROM tb_course tc 
      ${search ? `WHERE tc.name LIKE :formattedQueryParam` : ''}
      ORDER BY tc.name ASC
      LIMIT 5
      `,
      {
        replacements: { formattedQueryParam },
        type: QueryTypes.SELECT,
      },
    );

    const rowResult: Row[] = result.map((curr: any) => ({
      type: RowType.Course,
      id: curr.course_id,
      display: curr.name,
      describe: {
        type_course: curr.type,
      },
    }));

    return rowResult;
  }
}
