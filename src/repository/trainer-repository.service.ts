import { Injectable } from '@nestjs/common';
import { Row, RowType } from 'src/domain/entity';
import { ITrainerRepository } from 'src/domain/repository';
import { Sequelize } from 'sequelize-typescript';
import { StorageService } from 'src/framework/storage/storage.service';
import { QueryTypes } from 'sequelize';

@Injectable()
export class TrainerRepository implements ITrainerRepository {
  constructor(
    private sequelize: Sequelize,
    private storage: StorageService,
  ) {}

  async getTrainerByQuery(search: string): Promise<Row[]> {
    const formattedQueryParam = `%${search}%`;
    const result = await this.sequelize.query(
      `
      SELECT
        tt.trainer_id,
        IF(tt.subcon_member_id IS NOT NULL,
        'External',
        'Internal') AS trainer_type,
        IF(tt.subcon_member_id IS NOT NULL,
        tsm.name,
        te.firstname) AS trainer_name,
        IF(tt.subcon_member_id IS NOT NULL,
        tsm.join_date,
        tt.createdAt) AS join_date,
        IF(tt.subcon_member_id IS NOT NULL,
        tfsm.link,
        tfe.link) AS photo_profile,
        IF(tt.subcon_member_id IS NOT NULL,
        tsm.phone,
        tu.phone_number) AS phone_number,
        IF(tu.role_code IS NOT NULL, 
        tu.role_code,
        NULL) AS is_sme
      FROM
        tb_trainer tt
      LEFT JOIN tb_employee te
                                    ON
        tt.employee_number = te.employee_number
      LEFT JOIN tb_user tu
                                    ON
        te.user_id = tu.user_id
      LEFT JOIN tb_subcon_member tsm
                                    ON
        tt.subcon_member_id = tsm.subcon_member_id
      LEFT JOIN tb_file tfe
                                    ON
        te.file_id = tfe.file_id
      LEFT JOIN tb_file tfsm
                                    ON
        tsm.photo_profile = tfsm.file_id
      ${
        search
          ? `HAVING trainer_name LIKE :formattedQueryParam OR trainer_type LIKE :formattedQueryParam`
          : ''
      }
      ORDER BY trainer_name ASC
      LIMIT 10
      `,
      {
        replacements: { formattedQueryParam },
        type: QueryTypes.SELECT,
      },
    );

    const rowResult = await Promise.all(
      result.map(async (curr: any) => ({
        type: RowType.Trainer,
        id: curr.trainer_id,
        display: curr.trainer_name,
        describe: {
          is_sme: !!curr.is_sme,
          avatar: await this.storage.getLink(curr.photo_profile),
          type_trainer: curr.trainer_type,
        },
      })),
    );
    return Promise.resolve(rowResult);
  }
}
