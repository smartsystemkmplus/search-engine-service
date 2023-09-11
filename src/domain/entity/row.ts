export enum RowType {
  Employee = 'employee',
  Course = 'course',
  Document = 'document',
  Trainer = 'trainer',
  Post = 'post',
  Socmed = 'socmed',
}

export class Row {
  type: RowType;
  id: number;
  display: string;
  describe?: {
    is_sme?: boolean;
    nipp?: string;
    position?: string;
    avatar?: string;
    type_file?: string;
    type_course?: string;
    type_trainer?: string;
    link_file?: string;
    social_media_avatar?: string;
    category_name?: string;
    creator?: string;
  };
}
