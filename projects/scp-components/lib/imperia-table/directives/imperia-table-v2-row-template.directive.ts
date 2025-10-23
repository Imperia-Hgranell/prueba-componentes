import { Directive, Input, TemplateRef } from '@angular/core';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';

type ImperiaTableV2RowTemplateContext<TItem extends object> = {
  $implicit: {
    row: ImperiaTableRow<TItem>;
    rowIndex: number;
    columns: ImperiaTableColumn<TItem>[];
  };
};

@Directive({
  selector: '[imperiaTableV2RowTemplate]',
    standalone: false
})
export class ImperiaTableV2RowTemplateDirective<TItem extends object> {
  @Input('useOn') public useOn: 'frozenLeft' | 'unfrozen' | 'frozenRight' =
    'unfrozen';

  @Input('useWhen') public useWhen: (row: ImperiaTableRow<TItem>) => boolean =
    () => true;

  constructor(public template: TemplateRef<any>) {}

  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableV2RowTemplateDirective<TItem>,
    context: unknown,
  ): context is ImperiaTableV2RowTemplateContext<TItem> {
    return true;
  }
}
