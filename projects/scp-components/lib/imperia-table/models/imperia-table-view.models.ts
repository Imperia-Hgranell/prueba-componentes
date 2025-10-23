import { ImperiaTableColumn } from './imperia-table-columns.models';
import { ImperiaTableRow } from './imperia-table-rows.models';

export interface ImperiaTableVM<TItem extends object> {
  cellEditingState: boolean;
  value: ImperiaTableRow<TItem>[];
  columns: ImperiaTableColumn<TItem>[];
  fields: string[];
}

export interface ImperiaTableAddRowDialogVM<TItem extends object> {
  columns: ImperiaTableColumn<TItem>[];
  fields: string[];
}
