export enum RowType {
  Employee = "Employee",
  Course = "Course",
  Document = "Document"
}

export class Row {
  type: RowType
  id: number
  display: string
  query: string
}