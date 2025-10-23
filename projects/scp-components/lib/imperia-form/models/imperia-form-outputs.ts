import { FormControl, FormGroup } from '@angular/forms';
import { TImperiaTableColumnField } from '../../imperia-table/models/imperia-table-columns.types';
import { SetDataSyncFn } from '../../imperia-table/models/imperia-table-outputs.models';

export interface ImperiaFormOnSave<
  TItem extends object,
  TForm extends FormGroup = FormGroup
> {
  form: TForm;
  item: TItem;
  setDataSyncState: SetDataSyncFn;
}

export interface ImperiaFormOnFormCreate<
  TItem extends object,
  TControl extends object = TItem
> {
  form: FormGroup<{
    [K in TImperiaTableColumnField<TControl>]: FormControl<TControl[K]>;
  }>;
  item: TItem;
  setDataSyncState: SetDataSyncFn;
}

export interface ImperiaFormValueChanges<TItem extends object> {
  field: keyof TItem;
  oldValue: TItem;
  newValue: TItem;
  form: FormGroup<{ [K in keyof TItem]: FormControl<TItem[K]> }>;
  setDataSyncState: SetDataSyncFn;
}
