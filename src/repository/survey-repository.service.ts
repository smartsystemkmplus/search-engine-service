import { Injectable } from '@nestjs/common';
import { Row, RowType } from 'src/domain/entity';
import { ISurveyRepository } from 'src/domain/repository';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';

@Injectable()
export class SurveyRepository implements ISurveyRepository {
  constructor(private sequelize: Sequelize) { }

  async getSurveyByQuery(search: string): Promise<Row[]> {
    const formattedQueryParam = `%${search}%`;
    const result = await this.sequelize.query(
      `
      SELECT
        DISTINCT tsp.social_post_id,
        GROUP_CONCAT(DISTINCT tsppq.question) as context_text,
        tsp.social_employee_profile_id,
        tsep.firstName,
        'Survey' as category_name
      FROM tb_social_posts tsp
        LEFT JOIN tb_social_employee_profile tsep
          ON tsp.social_employee_profile_id = tsep.social_employee_profile_id
        LEFT JOIN tb_employee te
          ON tsep.employee_id = te.employee_id
        LEFT JOIN tb_social_post_categories tspc
          ON tsp.category_id = tspc.category_id
        INNER JOIN tb_social_post_poll tspp
          ON tspp.social_post_poll_id = tsp.social_post_poll_id
        LEFT JOIN tb_social_post_poll_question tsppq
          ON tsppq.social_post_poll_id = tspp.social_post_poll_id
      WHERE 1 = 1
        AND tsp.social_post_poll_id IS NOT NULL
        ${search ? `AND tsppq.question LIKE :formattedQueryParam` : ''}
      GROUP BY
        tsp.social_post_id

      LIMIT 5
      `,
      {
        replacements: { formattedQueryParam },
        type: QueryTypes.SELECT,
      },
    );

    const rowResult: Row[] = result.map((curr: any) => ({
      type: RowType.Survey,
      id: curr.social_post_id,
      display: curr.context_text,
      describe: {
        creator: curr.firstName,
        category_post: curr.category_name,
      },
    }));

    return rowResult;
  }
}
