import { Injectable } from '@nestjs/common';
import { Row, RowType } from 'src/domain/entity';
import { IPostRepository } from 'src/domain/repository';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(private sequelize: Sequelize) { }

  async getBlockedPost() {
    const result = await this.sequelize.query(
      `
        SELECT
          DISTINCT tspr.social_post_id
        FROM tb_social_post_report tspr
          WHERE tspr.status = 'BLOCKED'
      `,
      {
        type: QueryTypes.SELECT,
      },
    );

    return result
  }

  async getPostByQuery(search: string): Promise<Row[]> {
    const formattedQueryParam = `%${search}%`;
    const rawBlockedIds = await this.getBlockedPost()
    const blocked_post_ids = rawBlockedIds.map((e: any) => e.social_post_id)
    const result = await this.sequelize.query(
      `
      SELECT
        DISTINCT tsp.social_post_id,
        tsp.context_text,
        tsp.social_employee_profile_id,
        tsep.firstName,
        tspc.category_name
      FROM tb_social_posts tsp
        LEFT JOIN tb_social_employee_profile tsep
          ON tsp.social_employee_profile_id = tsep.social_employee_profile_id
        LEFT JOIN tb_employee te
          ON tsep.employee_id = te.employee_id
        LEFT JOIN tb_social_post_categories tspc
          ON tsp.category_id = tspc.category_id
      WHERE 1 = 1
        ${search ? `AND tsp.context_text LIKE :formattedQueryParam ` : ''}
        AND tsp.social_post_id NOT IN (${blocked_post_ids.length > 0 ? blocked_post_ids.join(',') : 0})
      LIMIT 5
      `,
      {
        replacements: { formattedQueryParam },
        type: QueryTypes.SELECT,
      },
    );

    const rowResult: Row[] = result.map((curr: any) => ({
      type: RowType.Post,
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
