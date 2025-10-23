import { Directive, Input, TemplateRef } from '@angular/core';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { Observable } from 'rxjs';

export type ImperiaTableHeaderCellTemplateContext<TItem extends object = any> =
  {
    $implicit: {
      col: ImperiaTableColumn<TItem>;
      colIndex: number;
      isFocused: boolean;
      isLastFrozenLeft?: boolean;
      isLastUnfrozen?: boolean;
      isFirstFrozenRight?: boolean;
      frozenColumnsOverflow?: boolean;
      position$: Observable<string>;
    };
  };

@Directive({
  selector: '[imperiaTableHeaderCell]',
  standalone: true,
})
export class ImperiaTableHeaderCellTemplateDirective<TItem extends object> {
  @Input('imperiaTableHeaderCell')
  field!: string;

  constructor(
    public template: TemplateRef<ImperiaTableHeaderCellTemplateContext<TItem>>,
  ) {}

  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableHeaderCellTemplateDirective<TItem>,
    context: unknown,
  ): context is ImperiaTableHeaderCellTemplateContext<TItem> {
    return true;
  }
  static ['ngTemplateGuard_impTableColumnHeaderCell']<TItem extends object>(
    dir: ImperiaTableHeaderCellTemplateDirective<TItem>,
    field: string,
  ): field is string {
    return true;
  }
}
