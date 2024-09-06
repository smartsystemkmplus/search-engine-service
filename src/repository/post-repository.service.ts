import { Injectable } from '@nestjs/common';
import { Row, RowType } from 'src/domain/entity';
import { IPostRepository } from 'src/domain/repository';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(private sequelize: Sequelize) { }

  async getPostByQueryAdvanced(words: string[]): Promise<Row[]> {
    // Remove the hardcoded words assignment

    // Generate locateStatement dynamically
    const locateStatement = words
      .map((word, index) => `LOCATE('${word}', tsp.context_text) as l${index + 1}`)
      .join(',\n      ');

    // Update completeConstraint to use all words
    const completeConstraint = `tsp.context_text LIKE '%${words.join(' ')}%'`;

    // Modify everyConstraint to create a condition for each word
    const everyConstraint = words
      .map(word => `tsp.context_text LIKE '%${word}%'`)
      .join('\n    AND ');

    // Adjust orderRating to handle any number of words
    const orderRating = words
      .map((_, index) => {
        const conditions = Array.from({ length: words.length - index }, (_, i) => `l${i + 1}`).join(' < ');
        return `WHEN ${conditions} THEN ${words.length - index}`;
      })
      .filter(condition => condition !== '')
      .join('\n    ');

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
            ${locateStatement},
            CASE
              WHEN
                ${completeConstraint}
              THEN ${words.length}
              WHEN
                ${everyConstraint}
              THEN ${words.length - 1}
              ELSE 0
            END query_rating
          FROM tb_social_posts tsp
          WHERE 1=1
            AND tsp.social_post_id NOT IN (${blocked_post_ids.length > 0 ? blocked_post_ids.join(',') : 0})
            AND (
              ${completeConstraint}
              OR (
                ${everyConstraint}
              )
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
    const splitSearch = search.trim().split(" ")
    console.log({ splitSearch })
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
