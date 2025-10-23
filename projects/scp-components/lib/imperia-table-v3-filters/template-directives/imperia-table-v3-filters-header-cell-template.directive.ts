import { Directive, Input, TemplateRef } from '@angular/core';
import { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';

export type ImperiaTableV3FiltersHeaderCellTemplateContext<
  TItem extends object
> = {
  $implicit: ImperiaTableColumn<TItem>;
};

@Directive({
  selector: '[imperia-table-v3-filters-header-cell-template]',
  standalone: false,
})
export class ImperiaTableV3FiltersHeaderCellTemplateDirective<
  TItem extends object
> {
  @Input('imperia-table-v3-filters-header-cell-template') slot!:
    | 'buttons'
    | 'icons';

  constructor(
    public template: TemplateRef<
      ImperiaTableV3FiltersHeaderCellTemplateContext<TItem>
    >
  ) {}

  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableV3FiltersHeaderCellTemplateDirective<TItem>,
    context: unknown
  ): context is ImperiaTableV3FiltersHeaderCellTemplateContext<TItem> {
    return true;
  }
}
