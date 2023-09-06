import * as dotenv from 'dotenv';
import AuthenticationError from '../common/error/AuthenticationError';
import AuthorizationError from '../common/error/AuthorizationError';
import { resErrorHandler } from 'src/common/error/resHandler';
import { ConfigService } from '@nestjs/config';
import TokenManager from '../common/helpers/jwt';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { UserInfoRepository } from 'src/repository/user-info-repository.service';

dotenv.config();

@Injectable()
export class kmsMiddleware implements NestMiddleware {
  constructor(
    private userInfo: UserInfoRepository,
    private configService: ConfigService,
    private tokenManager: TokenManager,
  ) {}
  async use(req: any, res: any, next: (error?: any) => void) {
    let requiredPrivilege: string;
    let isPass: any;
    try {
      const dataHeader =
        req?.headers?.['smartkmsystem-authorization'] ||
        req?.cookies?.smartkmsystemAuth ||
        '';
      const accessToken: string | null = dataHeader.startsWith('Bearer ')
        ? dataHeader.substring(7, dataHeader.length)
        : null;

      const decoded = this.tokenManager.check(accessToken);

      const setUserInformation = ({
        uid,
        group,
        user_id,
        role_code,
        employee_id,
        employee_number,
        privileges,
        social_employee_profile_id,
        vendor_id,
        vendor_member_id,
        subcon_id,
      }) => {
        res.locals.uid = uid;
        res.locals.group = group;
        res.locals.user_id = user_id;
        res.locals.role_code = role_code;
        res.locals.employee_id = employee_id;
        res.locals.employee_number = employee_number;
        res.locals.privileges = privileges;
        res.locals.social_employee_profile_id = social_employee_profile_id;
        res.locals.vendor_id = vendor_id;
        res.locals.vendor_member_id = vendor_member_id;
        res.locals.subcon_id = subcon_id;
      };

      if (!accessToken) {
        /**
         * this block of statement was created for eksternal company apps (example: SAP) with api-key
         * or can interact to other services too (with api-key)
         */
        if (
          this.configService.getOrThrow('API_KEY') === req.headers['api-key']
        ) {
          setUserInformation({
            uid: 'SERVER',
            group: 0,
            user_id: 0,
            role_code: 'SERVER',
            employee_id: 2,
            employee_number: '0',
            vendor_member_id: 1,
            subcon_id: 1,
            vendor_id: 1,
            social_employee_profile_id: 1,
            privileges: ['SA'],
          });
          return next();
        }
      }

      if (!decoded?.uid) {
        throw new AuthenticationError('Invalid Token: cannot parse uid');
      }

      const exp: number = decoded.exp;
      const currentTimeInSeconds: number = Math.floor(Date.now() / 1000);
      const diff: number = exp - currentTimeInSeconds;

      if (diff <= 0) {
        throw new AuthenticationError('Token Expired');
      } else if (diff < 3600) {
        const refreshToken: string = this.tokenManager.mint(decoded);
        res.set('kms-refresh-token', refreshToken);
      }

      /** get updated user information */
      const userUpdatedInformation = await this.userInfo.getUserInfo(
        decoded.user_id,
        requiredPrivilege,
      );

      // /** set loggedIn user information from decoded jwt */
      setUserInformation({
        uid: userUpdatedInformation?.uid || '',
        group: userUpdatedInformation?.group_id || 0,
        user_id: userUpdatedInformation.user_id || 0,
        role_code: userUpdatedInformation.role_code || '',
        employee_id: userUpdatedInformation.employee_id || 0,
        employee_number: userUpdatedInformation.employee_number || 0,
        social_employee_profile_id:
          userUpdatedInformation.social_employee_profile_id || 0,
        privileges: userUpdatedInformation.privileges || [],
        vendor_id: userUpdatedInformation?.vendor?.vendor_id || null,
        vendor_member_id: userUpdatedInformation?.vendor?.vendor_member_id || 0,
        subcon_id: userUpdatedInformation?.subcon?.subcon_id || null,
      });

      // /** super admin pass before checking privileges */
      if (res.locals.role_code === 'SA') {
        return next();
      }

      // /** checking requiredPrivilege */
      if (requiredPrivilege) {
        if (!res.locals.privileges.includes(requiredPrivilege)) {
          if (!isPass) {
            throw new AuthorizationError(
              `required privilege code: ${requiredPrivilege}`,
            );
          }
        } else {
          res.locals.hasPrivilege = true;
        }
      }

      /** user, sme, and managerial role with privilege pass */
      return next();
    } catch (error) {
      resErrorHandler(res, error);
    }
  }
}
