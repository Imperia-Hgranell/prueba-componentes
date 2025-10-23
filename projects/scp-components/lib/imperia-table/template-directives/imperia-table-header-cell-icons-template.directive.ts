import { Directive } from '@angular/core';
import { ImperiaTableHeaderCellTemplateContext } from './imperia-table-header-cell-template.directive';

@Directive({
  selector: '[imperiaTableHeaderCellIcons]',
  standalone: true,
})
export class ImperiaTableHeaderCellIconsTemplateDirective<
  TItem extends object = any,
> {
  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableHeaderCellIconsTemplateDirective<TItem>,
    context: unknown,
  ): context is ImperiaTableHeaderCellTemplateContext<TItem> {
    return true;
  }
}
