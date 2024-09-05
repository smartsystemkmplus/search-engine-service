import { Injectable } from '@nestjs/common';
import { Row, RowType } from 'src/domain/entity';
import { IPostRepository } from 'src/domain/repository';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(private sequelize: Sequelize) { }

  async getPostByQueryAdvanced(words: string[]): Promise<Row[]> {

    // * Statement to get locate occurances by words
    const locateStatement = `
      LOCATE('KMevent2024', tsp.context_text) as l1,
      LOCATE('COPVideo2024', tsp.context_text) as l2,
      LOCATE('HariPelindo2024', tsp.context_text) as l3,
    `
    // * Constraint that return if context_text contains all word exactly
    const completeConstraint = `tsp.context_text LIKE '%KMevent2024 COPVideo2024 HariPelindo2024%'`

    // * Constraint that return if context_text contains all word but separated
    const everyConstraint = `
    tsp.context_text LIKE '%KMevent2024%'
    AND tsp.context_text LIKE '%COPVideo2024%'
    AND tsp.context_text LIKE '%HariPelindo2024%'
    `

    // * Statement that give order_rating to word occurences
    const orderRating = `
    WHEN l1 < l2 AND l2 < l3 THEN 2
    WHEN l1 < l2 THEN 1
    `

    const rawBlockedIds = await this.getBlockedPost()
    const blocked_post_ids = rawBlockedIds.map((e: any) => e.social_post_id)
    const result = await this.sequelize.query(
      `
        WITH all_post AS (
          SELECT
            tsp.social_post_id,
            tsp.context_text,
            tsp.updatedAt,
            tsp.createdAt,
            ${locateStatement}
            -- LOCATE('KMevent2024', tsp.context_text) as l1,
            -- LOCATE('COPVideo2024', tsp.context_text) as l2,
            -- LOCATE('HariPelindo2024', tsp.context_text) as l3,
            CASE
              WHEN
                ${completeConstraint}
              THEN 2
              WHEN
                ${everyConstraint}
              THEN 1
              ELSE 0
            END query_rating
          FROM tb_social_posts tsp
          WHERE 1=1
            AND  ${completeConstraint}
            OR (
              ${everyConstraint}
            )
        )
        SELECT
          DISTINCT tsp.social_post_id,
          tsp.context_text,
          tsp.social_employee_profile_id,
          tsep.firstName,
          tspc.category_name,
          ap.query_rating,
          CASE
            ${orderRating}
            ELSE 0
          END as order_rating
        FROM all_post ap
          LEFT JOIN tb_social_posts tsp
            ON tsp.social_post_id = ap.social_post_id
          LEFT JOIN tb_social_employee_profile tsep
            ON tsp.social_employee_profile_id = tsep.social_employee_profile_id
          LEFT JOIN tb_employee te
            ON tsep.employee_id = te.employee_id
          LEFT JOIN tb_social_post_categories tspc
            ON tsp.category_id = tspc.category_id
        ORDER BY
          order_rating + query_rating,
          tsp.updatedAt,
          tsp.createdAt
        LIMIT 5
      `,
      {
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
    // * Check if search is needing advanced query
    const splitSearch = search.split(" ")
    if (splitSearch.length > 1) {
      return await this.getPostByQueryAdvanced(splitSearch)
    }

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
      ORDER BY
        tsp.createdAt DESC
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
