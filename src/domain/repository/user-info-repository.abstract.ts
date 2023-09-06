import { UserInfo } from '../entity';
export abstract class IUserInfoRepository {
  abstract getUserInfo(
    user_id: number,
    privilegeCode?: string,
  ): Promise<UserInfo>;
}
