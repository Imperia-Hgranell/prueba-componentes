import { Directive } from '@angular/core';
import type { ImperiaTableV2CellInternalSelection } from '../models/imperia-table-v2-cell-selection.models';
import { TImperiaTableColumnField } from '../models/imperia-table-columns.types';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';

export type ImperiaTableV2CellSelectionContextMenuButtonTemplate<
  TItem extends object,
> = {
  $implicit: {
    copying: {
      state: boolean;
      from: 'cell' | 'selection';
      totalCellsToCopy: number;
      result: boolean | null;
    };
    selection: Map<
      ImperiaTableRow<TItem>['dataKeyValue'],
      TImperiaTableColumnField<TItem>[]
    >;
    currentCellCountBeingCopied: number;
  };
  config: {
    text: string;
    items: ImperiaTableV2CellInternalSelection<TItem>;
    from: 'cell' | 'selection';
  };
};

@Directive({
  selector: '[imperiaTableV2CellSelectionContextMenuButtonTemplate]',
  standalone: false,
})
export class ImperiaTableV2CellSelectionContextMenuButtonTemplateDirective {
  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableV2CellSelectionContextMenuButtonTemplateDirective,
    context: unknown,
  ): context is ImperiaTableV2CellSelectionContextMenuButtonTemplate<TItem> {
    return true;
  }
}
