import { Injectable } from '@nestjs/common';
import { Row, RowType } from 'src/domain/entity';
import { IEmployeeRepository } from 'src/domain/repository';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class EmployeeRepository implements IEmployeeRepository {
  constructor(private sequelize: Sequelize) {}

  async get(query: string): Promise<Row[]> {
    const result = await this.sequelize.query(`
          SELECT
            *
          FROM tb_employee
          LIMIT 10
      `);

    const rowResult = result[0].reduce<Row[]>((arr: Array<any>, curr: any) => {
      arr.push({
        type: RowType.Employee,
        id: curr.employee_id,
        display: curr.firstname,
        query: 'Ahmad, 14124258, USER, Group Perikanan',
      });
      return arr;
    }, []);

    return new Promise((resolve, reject) => {
      resolve(rowResult);
    });
  }
}
