import { Directive } from '@angular/core';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';

export type ImperiaTableBodyCellContextMenuContext<TItem extends object> = {
  $implicit: {
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
    top: number;
    left: number;
    close: () => void;
  };
};

@Directive({
  selector: '[imperiaTableBodyCellContextMenuTemplate]',
  standalone: true,
})
export class ImperiaTableBodyCellContextMenuTemplateDirective<
  TItem extends object,
> {
  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableBodyCellContextMenuTemplateDirective<TItem>,
    context: unknown,
  ): context is ImperiaTableBodyCellContextMenuContext<TItem> {
    return true;
  }
}
