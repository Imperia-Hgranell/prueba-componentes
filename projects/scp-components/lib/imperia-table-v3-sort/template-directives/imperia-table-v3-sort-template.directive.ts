import { Directive, Input, TemplateRef } from '@angular/core';
import { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';

export type ImperiaTableV3SortTemplateContext<TItem extends object> = {
  $implicit: ImperiaTableColumn<TItem>;
};

@Directive({
  selector: '[imperia-table-v3-sort-template]',
  standalone: false,
})
export class ImperiaTableV3SortTemplateDirective<TItem extends object> {
  @Input('imperia-table-v3-sort-template') slot!: 'buttons' | 'icons';

  constructor(
    public template: TemplateRef<ImperiaTableV3SortTemplateContext<TItem>>
  ) {}

  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableV3SortTemplateDirective<TItem>,
    context: unknown
  ): context is ImperiaTableV3SortTemplateContext<TItem> {
    return true;
  }
}
