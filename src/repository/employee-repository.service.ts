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
  ) {}

  async getEmployeeByQuery(search: string): Promise<Row[]> {
    const formattedQueryParam = `%${search}%`;
    const result = await this.sequelize.query(
      `
    WITH MaxLastUpdated AS (
      SELECT
        tep3.position_id,
        tep3.employee_number,
        MAX(tep3.last_updated_date) AS newest_last_updated_date
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
        tpv.name AS position_name,
        tpv.job_class_level,
        tpv.personal_area,
        tpv.subpersonal_area AS sub_personal_area,
        te.employee_id,
        te.firstname AS name,
        tepic.date_of_birth,
        te.user_id,
        tu.role_code,
        te.file_id,
        tu.email,
        tf.link AS avatar,
        tu.phone_number,
        ROW_NUMBER() OVER (PARTITION BY sub.position_id,
                      sub.employee_number
      ORDER BY
                      sub.begin_date DESC) AS row_num
      FROM
        MaxLastUpdated max_dates
      JOIN tb_employee_position sub
              ON
        max_dates.position_id = sub.position_id
        AND max_dates.employee_number = sub.employee_number
        AND max_dates.newest_last_updated_date = sub.last_updated_date
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
      ),
      NumberedRows AS (
      SELECT
        rr.*,
        ROW_NUMBER() OVER (PARTITION BY rr.employee_number
      ORDER BY
        rr.last_updated_date DESC) AS employee_row_num
      FROM
        RankedRows rr
      )
      SELECT
        nr.employee_id,
        nr.name,
        nr.employee_number,
        nr.position_id,
        nr.position_name,
        nr.role_code AS is_sme,
        nr.date_of_birth,
        nr.email,
        nr.avatar,
        nr.phone_number,
        nr.job_class_level,
        nr.personal_area,
        nr.sub_personal_area
      FROM
        NumberedRows nr
      WHERE
        nr.row_num = 1
        AND nr.employee_row_num = 1
        ${
          search
            ? `AND (nr.name LIKE :formattedQueryParam 
                      OR nr.employee_number LIKE :formattedQueryParam 
                      OR nr.position_name LIKE :formattedQueryParam)`
            : ''
        }
      ORDER BY
        nr.name ASC
        LIMIT 10
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
