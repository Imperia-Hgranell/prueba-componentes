import { Directive } from '@angular/core';
import { _ImperiaTableV2CellInternalSelection } from '../components/imperia-table-v2-selection/imperia-table-v2-cell-selection/imperia-table-v2-cell-selection.component';
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
    items: _ImperiaTableV2CellInternalSelection<TItem>;
    from: 'cell' | 'selection';
  };
};

@Directive({
  selector: '[imperiaTableV2CellSelectionContextMenuButtonTemplate]',
    standalone: false
})
export class ImperiaTableV2CellSelectionContextMenuButtonTemplateDirective {
  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableV2CellSelectionContextMenuButtonTemplateDirective,
    context: unknown,
  ): context is ImperiaTableV2CellSelectionContextMenuButtonTemplate<TItem> {
    return true;
  }
}
