import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import AuthenticationError from '../common/error/AuthenticationError';
import NotFoundError from '../common/error/NotFoundError';
import { Injectable } from '@nestjs/common';
import { IUserInfoRepository } from 'src/domain/repository';
import { UserInfo } from 'src/domain/entity';

/** Use Redis; this function will always be called in middleware */
@Injectable()
export class UserInfoRepository implements IUserInfoRepository {
  constructor(private sequelize: Sequelize) {}
  async getUserInfo(
    user_id: number,
    privilegeCode?: string,
  ): Promise<UserInfo> {
    const user: any = await this.sequelize
      .query(
        `
    SELECT tu.user_id, 
      tu.uid, 
      tu.role_code, 
      tu.privilege_group_id, 
      te.employee_id, 
      te.employee_number,
      te.old_employee_number,
      te.archived_at, 
      te.group_id,
      tsep.social_employee_profile_id,
      GROUP_CONCAT(DISTINCT turc.role_code) AS role_code
    FROM tb_user tu
    LEFT JOIN tb_employee te ON tu.user_id = te.user_id AND te.deletedAt IS NULL
    LEFT JOIN tb_social_employee_profile tsep ON te.employee_id = tsep.employee_id
    LEFT JOIN tb_user_role_code turc ON turc.user_id = tu.user_id
    WHERE 1=1 AND
    tu.deletedAt IS NULL AND
    tu.user_id = ${user_id}
    GROUP BY tu.user_id, te.employee_id, tsep.social_employee_profile_id 
    LIMIT 1
  `,
        { type: QueryTypes.SELECT },
      )
      .then((e: any) => e[0]);

    if (!user) {
      throw new NotFoundError('user not found');
    }

    user.role_code = user.role_code?.split(',');

    let privileges: string[] = [];

    let vendor: any = {};
    let subcon: any = {};
    if (user.role_code.includes('VNDR')) {
      vendor = await this.sequelize.query(
        `
      SELECT tvm.vendor_member_id, tvm.vendor_id, tvm.photo_profile, tvm.name FROM tb_vendor_member tvm
      INNER JOIN tb_user tu ON tvm.user_id = tu.user_id AND tu.user_id = ${user_id}
    `,
        {
          type: QueryTypes.SELECT,
        },
      );
    }
    if (user.role_code.includes('SBCN')) {
      subcon = await this.sequelize.query(
        `
      SELECT tvm.subcon_member_id, tvm.subcon_id, tvm.photo_profile, tvm.name FROM tb_subcon_member tvm
      INNER JOIN tb_user tu ON tvm.user_id = tu.user_id AND tu.user_id = ${user_id}
    `,
        {
          type: QueryTypes.SELECT,
        },
      );
    }
    if (user.employee_id) {
      if (user.archived_at) {
        throw new AuthenticationError(
          'sorry, archived employee unable to login',
        );
      }
      if (user.privilege_group_id) {
        const privilegesResult: { privilege_code: string }[] =
          await this.sequelize.query(
            `
          SELECT privilege_code FROM tb_privilege_privilege_group tppg 
          WHERE 1 = 1
          AND privilege_group_id = 3
          AND deletedAt IS NULL
          ${privilegeCode ? `AND privilege_code = '${privilegeCode}'` : ''}
        `,
            { type: QueryTypes.SELECT },
          );

        privileges = privilegesResult.map((e) => e.privilege_code);
      }
    }

    return {
      ...user,
      vendor: vendor?.[0],
      subcon: subcon?.[0],
      privileges: privileges.map((e: any) => e.privilege_code),
    };
  }
}
