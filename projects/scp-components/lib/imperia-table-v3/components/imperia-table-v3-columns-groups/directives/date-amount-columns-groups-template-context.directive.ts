import { Directive } from '@angular/core';
import { DateAmountColumnsGroupsRecord } from '@imperiascm/scp-utils/functions';

type DateAmountColumnsGroupsTemplateContext = {
  $implicit: DateAmountColumnsGroupsRecord;
};

@Directive({
  selector: '[dateAmountColumnsGroupsTemplateContext]',
  standalone: true,
})
export class DateAmountColumnsGroupsTemplateContextDirective {
  constructor() {}

  static ngTemplateContextGuard(
    directive: DateAmountColumnsGroupsTemplateContextDirective,
    context: unknown
  ): context is DateAmountColumnsGroupsTemplateContext {
    return true;
  }
}
