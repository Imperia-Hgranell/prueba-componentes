import { Directive, Input, TemplateRef } from '@angular/core';
import { ImperiaTableCellTemplateContext } from '../models/imperia-table-cells.types';
/**
 * @deprecated
 */
@Directive({
  selector: '[imp-column-cell-template]',
    standalone: false
})
export class ImpColumnCellTemplateDirective<TItem extends object = any> {
  @Input('imp-column-cell-template')
  field!: string /* TImperiaTableColumnField<TItem> con esto seria perfecto, pero no se como hacerlo y que no peten todas las templates */;
  constructor(
    public template: TemplateRef<ImperiaTableCellTemplateContext<TItem>>,
  ) {}

  static ngTemplateContextGuard<TItem extends object>(
    directive: ImpColumnCellTemplateDirective<TItem>,
    context: unknown,
  ): context is ImperiaTableCellTemplateContext<TItem> {
    return true;
  }

  static ['ngTemplateGuard_imp-column-cell-template']<TItem extends object>(
    dir: ImpColumnCellTemplateDirective<TItem>,
    field: string /* TImperiaTableColumnField<TItem> con esto seria perfecto, pero no se como hacerlo y que no peten todas las templates */,
  ): field is string /* TImperiaTableColumnField<TItem> con esto seria perfecto, pero no se como hacerlo y que no peten todas las templates */ {
    return true;
  }
}
