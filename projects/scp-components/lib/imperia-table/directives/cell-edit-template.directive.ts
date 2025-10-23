import { Directive, Input, TemplateRef } from '@angular/core';
import { ImperiaTableCell } from '../models/imperia-table-cells.models';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { TImperiaTableColumnDataInfoTypes } from '../models/imperia-table-columns.types';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';

export type ImperiaTableCellEditTemplateContext<
  TDataInfo extends
    TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes,
> = {
  $implicit: ImperiaTableCell<any, string, TDataInfo>;
  col: ImperiaTableColumn<any, TDataInfo>;
  row: ImperiaTableRow<any>;
};
/**
 * @deprecated
 */
@Directive({
  selector: '[cell-edit-template]',
    standalone: false
})
export class CellEditTemplateDirective<
  TType extends
    TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes,
> {
  @Input('cell-edit-template') type!: TType;
  constructor(
    public template: TemplateRef<ImperiaTableCellEditTemplateContext<TType>>,
  ) {}

  static ngTemplateContextGuard<TType extends TImperiaTableColumnDataInfoTypes>(
    directive: CellEditTemplateDirective<TType>,
    context: unknown,
  ): context is ImperiaTableCellEditTemplateContext<TType> {
    return true;
  }

  static ['ngTemplateGuard_cell-edit-template']<
    TType extends TImperiaTableColumnDataInfoTypes,
  >(
    dir: CellEditTemplateDirective<TType>,
    type: TImperiaTableColumnDataInfoTypes,
  ): type is TImperiaTableColumnDataInfoTypes {
    return true;
  }
}
