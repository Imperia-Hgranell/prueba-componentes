import { Directive } from '@angular/core';

export type ImpFormErrorsTemplateDirectiveContext = {
  $implicit: {
    formErrors: string[];
    controlsWithErrors: {
      label: string;
      errors: {
        name: string;
        value: any;
      }[];
    }[];
    confirmMessage?: string;
  };
};

@Directive({
  selector: '[imp-form-errors-template]',
  standalone: true,
})
export class ImpFormErrorsTemplateDirective {
  static ngTemplateContextGuard(
    directive: ImpFormErrorsTemplateDirective,
    context: unknown,
  ): context is ImpFormErrorsTemplateDirectiveContext {
    return true;
  }
}
