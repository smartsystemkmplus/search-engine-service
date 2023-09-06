export class UserInfo {
  uid: string;
  role_code: string;
  user_id?: number;
  privilege_group_id?: number;
  employee_id: number;
  employee_number: string;
  old_employee_number?: string;
  archived_at?: boolean;
  group_id: number;
  social_employee_profile_id: number;
  vendor?: {
    vendor_id?: number;
    vendor_member_id?: number;
  };
  subcon?: {
    subcon_id?: number;
    subcon_member_id?: number;
  };
  privileges: string;
}
