import { Directive, Input, TemplateRef } from '@angular/core';

export type ImperiaTableV3LoadingTemplateContext = {
  $implicit: never;
};

@Directive({
  selector: '[imperia-table-v3-loading-template]',
    standalone: false
})
export class ImperiaTableV3LoadingTemplateDirective {
  @Input('imperia-table-v3-loading-template') slot!: 'top' | 'bottom';

  constructor(
    public template: TemplateRef<ImperiaTableV3LoadingTemplateContext>,
  ) {}

  static ngTemplateContextGuard(
    directive: ImperiaTableV3LoadingTemplateDirective,
    context: unknown,
  ): context is ImperiaTableV3LoadingTemplateContext {
    return true;
  }
}
