import { FormControl, FormGroup } from '@angular/forms';
import { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';
import { SetDataSyncFn } from '../../imperia-table/models/imperia-table-outputs.models';

export type ImperiaFormDataSyncState =
  | 'saved'
  | 'unsaved'
  | 'saving'
  | 'error'
  | 'canceled';

export type ImperiaFormDataSyncAction = 'add' | 'update' | 'delete' | 'other';

export interface ImperiaFormViewModel {
  form: FormGroup;
  height: string;
  onlyShowTemplate: boolean;
  editable: boolean;
  dataSyncState: ImperiaFormDataSyncState;
}

export interface ImperiaFormTemplateContext<TItem extends object> {
  $implicit: FormGroup<{ [K in keyof TItem]: FormControl<TItem[K]> }>;
  fields: ImperiaTableColumn<TItem>[];
  setDataSyncFn: SetDataSyncFn;
  item: TItem;
  editable: boolean;
}
