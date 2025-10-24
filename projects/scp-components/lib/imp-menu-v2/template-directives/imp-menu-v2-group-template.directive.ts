import { Directive } from '@angular/core';
import type { ImpMenuV2ItemGroupDirective } from '../directives/imp-menu-v2-item-group.directive';

export type ImpMenuV2ItemGroupTemplateContext = {
  $implicit: ImpMenuV2ItemGroupDirective;
};

@Directive({
  selector: '[imp-menu-v2-group-template]',
  standalone: false,
})
export class ImpMenuV2GroupTemplateDirective {
  static ngTemplateContextGuard(
    directive: ImpMenuV2GroupTemplateDirective,
    context: unknown
  ): context is ImpMenuV2ItemGroupTemplateContext {
    return true;
  }
}
