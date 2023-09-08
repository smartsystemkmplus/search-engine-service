import { Injectable } from '@nestjs/common';
import { Row, RowType } from 'src/domain/entity';
import { IDocumentRepository } from 'src/domain/repository';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { StorageService } from 'src/framework/storage/storage.service';

@Injectable()
export class DocumentRepository implements IDocumentRepository {
  constructor(
    private sequelize: Sequelize,
    private storage: StorageService,
  ) {}

  async getDocumentByQuery(search: string): Promise<Row[]> {
    const formattedQueryParam = `%${search}%`;
    const result = await this.sequelize.query(
      `
    SELECT
      tr.repo_id,
      tr.title,
      tr.type,
      tf.link
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

    const rowResult = await Promise.all(
      result.map(async (curr: any) => ({
        type: RowType.Document,
        id: curr.repo_id,
        display: curr.title,
        describe: {
          link_file: await this.storage.getLink(curr.link),
          type_file: curr.type.toLowerCase(),
        },
      })),
    );
    return Promise.resolve(rowResult);
  }
}
