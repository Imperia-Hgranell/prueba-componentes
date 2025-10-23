import { Directive } from '@angular/core';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';

export type ImperiaTableHeaderCellContextMenuContext<TItem extends object> = {
  $implicit: {
    col: ImperiaTableColumn<TItem>;
    top: number;
    left: number;
    close: () => void;
  };
};

@Directive({
  selector: '[imperiaTableHeaderCellContextMenuTemplate]',
  standalone: true,
})
export class ImperiaTableHeaderCellContextMenuTemplateDirective<
  TItem extends object,
> {
  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableHeaderCellContextMenuTemplateDirective<TItem>,
    context: unknown,
  ): context is ImperiaTableHeaderCellContextMenuContext<TItem> {
    return true;
  }
}
