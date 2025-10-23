import { Directive, TemplateRef } from '@angular/core';
import { ImperiaTableBodyCellContextMenuContext } from './imperia-table-body-cell-context-menu-template.directive';

export type ImperiaTableBodyCellContextMenuButtonContext<TItem extends object> =
  {
    $implicit: ImperiaTableBodyCellContextMenuContext<TItem>['$implicit'];
    menu: {
      copying: {
        state: boolean;
        from: 'row' | 'selection';
        totalRowsToCopy: number;
        result: boolean | null;
      };
      selection: any[];
      currentRowCountBeingCopied: number;
    };
  };

@Directive({
  selector: '[imperiaTableBodyCellContextMenuButtonTemplate]',
    standalone: false
})
export class ImperiaTableBodyCellContextMenuButtonTemplateDirective<
  TItem extends object,
> {
  constructor(
    public template: TemplateRef<
      ImperiaTableBodyCellContextMenuButtonContext<TItem>
    >,
  ) {}

  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableBodyCellContextMenuButtonTemplateDirective<TItem>,
    context: unknown,
  ): context is ImperiaTableBodyCellContextMenuButtonContext<TItem> {
    return true;
  }
}
