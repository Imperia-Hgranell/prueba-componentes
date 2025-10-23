import { Directive, TemplateRef } from '@angular/core';

export type ImperiaTableV2BlockerTemplateContext = never;

@Directive({
  selector: '[imperiaTableV2BlockerTemplate]',
    standalone: false
})
export class ImperiaTableV2BlockerTemplateDirective {
  constructor(
    public template: TemplateRef<ImperiaTableV2BlockerTemplateContext>,
  ) {}

  static ngTemplateContextGuard(
    directive: ImperiaTableV2BlockerTemplateDirective,
    context: unknown,
  ): context is ImperiaTableV2BlockerTemplateContext {
    return true;
  }
}
