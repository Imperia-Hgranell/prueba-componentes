import { Directive, Input } from '@angular/core';
import { ImperiaFormTemplateContext } from '../models/imperia-form.types';
@Directive({
  selector: '[imperia-form-menu-template]',
    standalone: false
})
export class ImperiaFormMenuTemplateDirective<TItem extends object> {
  @Input('imperia-form-menu-template') public item: TItem | string = '';
  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaFormMenuTemplateDirective<TItem>,
    context: unknown,
  ): context is ImperiaFormTemplateContext<TItem> {
    return true;
  }

  static ['ngTemplateGuard_imperia-form-menu-template']<TItem extends object>(
    dir: ImperiaFormMenuTemplateDirective<TItem>,
    item: TItem | string,
  ): item is TItem | string {
    return true;
  }
}
