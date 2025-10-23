import { Directive, Input, TemplateRef } from '@angular/core';
import { ImperiaTableColumnsGroupsTemplateContext } from '../models/imperia-table-columns-groups.types';
/**
 * @deprecated
 */
@Directive({
  selector: '[imp-columns-group-template]',
  standalone: true,
})
export class ImpColumnsGroupTemplateDirective<TItem extends object = any> {
  @Input('imp-columns-group-template')
  key!: string;
  constructor(
    public template: TemplateRef<
      ImperiaTableColumnsGroupsTemplateContext<TItem>
    >
  ) {}

  static ngTemplateContextGuard<TItem extends object>(
    directive: ImpColumnsGroupTemplateDirective<TItem>,
    context: unknown
  ): context is ImperiaTableColumnsGroupsTemplateContext<TItem> {
    return true;
  }

  static ['ngTemplateGuard_imp-column-header-cell-template']<
    TItem extends object
  >(dir: ImpColumnsGroupTemplateDirective<TItem>, key: string): key is string {
    return true;
  }
}
