import { Injectable } from '@nestjs/common';
import { Row, RowType } from 'src/domain/entity';
import { IEmployeeRepository } from 'src/domain/repository';
import { Sequelize } from 'sequelize-typescript';
import { StorageService } from 'src/framework/storage/storage.service';
import { QueryTypes } from 'sequelize';

@Injectable()
export class EmployeeRepository implements IEmployeeRepository {
  constructor(
    private sequelize: Sequelize,
    private storage: StorageService,
  ) { }




  async getEmployeeByQuery(search: string): Promise<Row[]> {
    const formattedQueryParam = `%${search}%`;
    const result = await this.sequelize.query(
      `
      WITH MaxLastUpdated AS (
        SELECT
          tep3.position_id,
          tep3.employee_number,
          tep3.last_updated_date AS newest_last_updated_date
        FROM
          tb_employee_position tep3
        LEFT JOIN safm_perubahan_organisasi spo
                ON
          tep3.employee_number = spo.PNALT_NEW
        WHERE
          DATE(tep3.end_date) = '9999-12-31'
        GROUP BY
          tep3.position_id,
          tep3.employee_number
        ),
        RankedRows AS (
        SELECT
          sub.*,
          max(max_dates.newest_last_updated_date),
          tpv.name AS position_name,
          te.employee_id,
          te.firstname AS name,
          te.user_id,
          tu.role_code,
          te.file_id,
          tu.email,
          tf.link AS avatar,
          tu.phone_number

        FROM
          MaxLastUpdated max_dates
        JOIN tb_employee_position sub
                ON
          max_dates.position_id = sub.position_id
          AND max_dates.employee_number = sub.employee_number
        LEFT JOIN tb_position_v2 tpv
            ON
            sub.position_id = tpv.position_id
        LEFT JOIN tb_employee te
            ON
            sub.employee_number = te.employee_number
        LEFT JOIN tb_employee_private_information_citizenship tepic
                ON
          te.employee_id = tepic.employee_id
        LEFT JOIN tb_user tu
                ON
          te.user_id = tu.user_id
        LEFT JOIN tb_file tf
                ON
          te.file_id = tf.file_id
        WHERE
          DATE(sub.end_date) = '9999-12-31'
            AND te.firstname IS NOT NULL
        GROUP BY
        	te.employee_id
        )
        SELECT
          max(nr.employee_id),
          nr.name,
          nr.employee_number,
          nr.position_id,
          nr.position_name,
          nr.role_code AS is_sme,
          nr.avatar
        FROM
          RankedRows nr
        WHERE 1=1

        ${search
        ? `AND (nr.name LIKE :formattedQueryParam
                        OR nr.employee_number LIKE :formattedQueryParam
                        OR nr.position_name LIKE :formattedQueryParam)`
        : ''
      }
      GROUP BY
          nr.employee_number
      ORDER BY
        nr.name ASC
        LIMIT 5
      `,
      {
        replacements: { formattedQueryParam },
        type: QueryTypes.SELECT,
      },
    );

    const rowResult = await Promise.all(
      result.map(async (curr: any) => ({
        type: RowType.Employee,
        id: curr.employee_id,
        display: curr.name,
        describe: {
          is_sme: !!curr.is_sme,
          nipp: curr.employee_number,
          position: curr.position_name,
          avatar: await this.storage.getLink(curr.avatar),
        },
      })),
    );
    return Promise.resolve(rowResult);
  }
}
