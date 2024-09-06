import { Injectable } from '@nestjs/common';
import { Row, RowType } from 'src/domain/entity';
import { IProfileRepository } from 'src/domain/repository';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { StorageService } from 'src/framework/storage/storage.service';

@Injectable()
export class ProfileRepository implements IProfileRepository {
  constructor(
    private sequelize: Sequelize,
    private storage: StorageService,
  ) { }

  async getProfileByQuery(search: string): Promise<Row[]> {
    const formattedQueryParam = `%${search}%`;
    const result = await this.sequelize.query(
      `
      SELECT
        tsep.social_employee_profile_id,
        tsep.firstName,
        tf.link,
        te.employee_number
      FROM tb_social_employee_profile tsep
        LEFT JOIN tb_file tf
          ON tsep.avatar = tf.file_id
        LEFT JOIN tb_employee te
          ON tsep.employee_id = te.employee_id
      WHERE 1 = 1
      ${search ? `AND tsep.firstName LIKE :formattedQueryParam` : ''}
      ORDER BY tsep.firstName ASC
      LIMIT 5
      `,
      {
        replacements: { formattedQueryParam },
        type: QueryTypes.SELECT,
      },
    );

    const rowResult = await Promise.all(
      result.map(async (curr: any) => ({
        type: RowType.Socmed,
        id: curr.social_employee_profile_id,
        display: curr.firstName,
        describe: {
          social_media_avatar: await this.storage.getLink(curr.link),
          nipp: curr.employee_number,
        },
      })),
    );
    return Promise.resolve(rowResult);
  }
}
