import { Directive, Input, TemplateRef } from '@angular/core';
import { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';
import { ImperiaTableRow } from '../../imperia-table/models/imperia-table-rows.models';

export type ImperiaTableV3FiltersBodyCellTemplateContext<TItem extends object> =
  {
    $implicit: { col: ImperiaTableColumn<TItem>; row: ImperiaTableRow<TItem> };
  };

@Directive({
  selector: '[imperia-table-v3-filters-body-cell-template]',
  standalone: false,
})
export class ImperiaTableV3FiltersBodyCellTemplateDirective<
  TItem extends object
> {
  @Input('imperia-table-v3-filters-body-cell-template') slot!:
    | 'buttons'
    | 'icons';

  constructor(
    public template: TemplateRef<
      ImperiaTableV3FiltersBodyCellTemplateContext<TItem>
    >
  ) {}

  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableV3FiltersBodyCellTemplateDirective<TItem>,
    context: unknown
  ): context is ImperiaTableV3FiltersBodyCellTemplateContext<TItem> {
    return true;
  }
}
