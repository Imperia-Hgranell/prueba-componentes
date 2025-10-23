import { FormControl } from '@angular/forms';
import { FilterOperator } from '@imperiascm/scp-utils/payload';
import { ImperiaTableColumn } from './imperia-table-columns.models';
import { TImperiaTableColumnField } from './imperia-table-columns.types';

export class ImperiaTableColumnFilterFormControls {
  value: FormControl;
  operator: FormControl;

  constructor(value: any, operator: FilterOperator) {
    this.value = new FormControl(value);
    this.operator = new FormControl(operator);
  }
}

type TImperiaTableFilterValueColumn<TItem extends object> =
  | string
  | TImperiaTableColumnField<TItem>
  | ImperiaTableColumn<TItem>;

export class ImperiaTableFilterValue<
  TItem extends object,
  TColumn extends TImperiaTableFilterValueColumn<TItem> = ImperiaTableColumn<TItem>
> {
  Column: TColumn;
  Value: string | string[] | number | number[] | boolean;
  Operator: FilterOperator;
  constructor(
    Column: TColumn,
    Value: string | string[] | number | number[] | boolean,
    Operator: FilterOperator
  ) {
    this.Column = Column;
    this.Value = Value;
    this.Operator = Operator;
  }
}
