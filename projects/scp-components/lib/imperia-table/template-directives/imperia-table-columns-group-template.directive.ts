import { Directive } from '@angular/core';
import { ImperiaTableV3ColumnsGroupDirective } from '../../imperia-table-v3/directives/imperia-table-v3-columns-group-directive.directive';
import { ImperiaTableColumnsGroup } from '../models/imperia-table-columns-groups.models';
import { Observable } from 'rxjs';

export type ImperiaTableColumnsGroupTemplateContext<TItem extends object> = {
  $implicit: {
    colGroupDirective: ImperiaTableV3ColumnsGroupDirective<TItem>;
    colGroup: ImperiaTableColumnsGroup<TItem>;
    colGroupIndex: number;
    isLastFrozenLeft?: boolean;
    isLastUnfrozen?: boolean;
    frozenLeftColumnsWidth?: number;
    isFirstFrozenRight?: boolean;
    frozenColumnsOverflow?: boolean;
    position$?: Observable<string>;
  };
};

@Directive({
  selector: '[imperiaTableColumnsGroupTemplate]',
  standalone: true,
})
export class ImperiaTableColumnsGroupTemplateDirective {
  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableColumnsGroupTemplateDirective,
    context: unknown
  ): context is ImperiaTableColumnsGroupTemplateContext<TItem> {
    return true;
  }
}
