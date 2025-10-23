import { Directive, Input } from '@angular/core';
import { ImperiaFormTemplateContext } from '../models/imperia-form.types';

@Directive({
  selector: '[imperia-form-template]',
    standalone: false
})
export class ImperiaFormTemplateDirective<TItem extends object> {
  @Input('imperia-form-template') public item: TItem | string = '';
  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaFormTemplateDirective<TItem>,
    context: unknown,
  ): context is ImperiaFormTemplateContext<TItem> {
    return true;
  }

  static ['ngTemplateGuard_imperia-form-template']<TItem extends object>(
    dir: ImperiaFormTemplateDirective<TItem>,
    item: TItem | string,
  ): item is TItem | string {
    return true;
  }
}
