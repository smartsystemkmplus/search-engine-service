import { Injectable } from '@nestjs/common';
import { Row, RowType } from 'src/domain/entity';
import { IDocumentRepository } from 'src/domain/repository';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';

@Injectable()
export class DocumentRepository implements IDocumentRepository {
  constructor(private sequelize: Sequelize) {}

  async getDocumentByQuery(search: string): Promise<Row[]> {
    const formattedQueryParam = `%${search}%`;
    const result = await this.sequelize.query(
      `
    SELECT
      tr.repo_id,
      tr.title,
      tr.type
    FROM tb_repo tr 
      LEFT JOIN tb_file tf 
        ON tr.file_id = tf.file_id
    WHERE 1 = 1 
    ${search ? `AND tr.title LIKE :formattedQueryParam` : ''}
    ORDER BY tr.title ASC
    LIMIT 10
      `,
      {
        replacements: { formattedQueryParam },
        type: QueryTypes.SELECT,
      },
    );

    const rowResult: Row[] = result.map((curr: any) => ({
      type: RowType.Document,
      id: curr.repo_id,
      display: curr.title,
      describe: {
        type_file: curr.type.toLowerCase(),
      },
    }));

    return rowResult;
  }
}
