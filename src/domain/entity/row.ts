export enum RowType {
  Employee = 'employee',
  Course = 'course',
  Document = 'document',
  Trainer = 'trainer',
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
  };
}
