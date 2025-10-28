import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  FormGroupDirective,
  ValidationErrors,
} from '@angular/forms';
import {
  CanNotBeLessGreaterType,
  isCanNotBeLessGreaterError,
} from '../../errors/canNotBeLessGreater';
import {
  ImpFormErrorsTemplateDirective,
  ImpFormErrorsTemplateDirectiveContext,
} from '../../template-directives/imp-form-errors-template.directive';
import { ImpLabelComponent } from '../../../imp-label/imp-label.component';
import { isAtLeastOneFieldError } from '../../errors/atLeastOneField';
import { isIfIsTruthyThenIsRequiredError } from '../../errors/ifIsTruthyThenIsRequired';
import { isIfThisIsThenThatCanNotBeZeroError } from '../../errors/ifThisIsThenThatCanNotBeZero';
import { isIfThisIsThenThatIsRequiredError } from '../../errors/ifThisIsThenThatIsRequired';
import { LOCALE } from '@imperiascm/scp-utils/functions';
import { ImpOverlayService } from '@imperiascm/scp-utils/overlay';
import { ImpTranslateModule, ImpTranslatePipe } from '@imperiascm/translate';
import { from, Observable, of } from 'rxjs';

@Component({
  selector: 'imp-form-errors',
  standalone: true,
  imports: [
    CommonModule,
    ImpFormErrorsTemplateDirective,
    ImpLabelComponent,
    ImpTranslateModule,
    ImpTranslatePipe,
  ],
  providers: [ImpTranslatePipe],
  templateUrl: './imp-form-errors.component.html',
  styleUrls: ['./imp-form-errors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpFormErrorsComponent {
  public readonly LOCALE = LOCALE();

  @Input() translations: null | Record<
    string,
    string | { label?: string; header?: string }
  > = {};

  @Input() childForms: FormGroup[] = [];
  @Input() title: string = '';
  @Input() showErrorsLabel: boolean = true;

  @ViewChild('errorsTemplate', { static: true })
  private errorsTemplate!: TemplateRef<ImpFormErrorsTemplateDirectiveContext>;

  private errorsShown: boolean = false;

  constructor(
    private translatePipe: ImpTranslatePipe,
    private formGroupDirective: FormGroupDirective,
    private overlayService: ImpOverlayService
  ) {}

  public show(): boolean {
    if (this.errorsShown) return this.checkHaveErrors();

    const formErrors = this.getFormErrors();
    const controlsWithErrors = this.getControlsWithErrors();

    if (!formErrors.length && !controlsWithErrors.length) return false;

    this.errorsShown = true;

    this.overlayService
      .alert(this.errorsTemplate, {
        title:
          this.title ??
          this.translatePipe.transform('IMP_FORM_ERRORS.alert.title'),
        templateContext: {
          $implicit: { formErrors, controlsWithErrors },
        },
        minWidth: '600px',
      })
      .then(() => (this.errorsShown = false));
    return true;
  }

  public confirm(confirmMessage: string = ''): Observable<boolean> {
    if (this.errorsShown) return of(this.checkHaveErrors());

    const formErrors = this.getFormErrors();
    const controlsWithErrors = this.getControlsWithErrors();

    if (!formErrors.length && !controlsWithErrors.length) return of(false);

    this.errorsShown = true;

    return from(
      this.overlayService
        .confirm(this.errorsTemplate, {
          title:
            this.title ??
            this.translatePipe.transform('IMP_FORM_ERRORS.alert.title'),
          templateContext: {
            $implicit: { formErrors, controlsWithErrors, confirmMessage },
          },
          minWidth: '600px',
          hasBackdrop: false,
        })
        .then((response) => {
          this.errorsShown = false;
          return response;
        })
    );
  }

  checkHaveErrors() {
    const formHasErrors = !!Object.values({
      ...this.formGroupDirective.form.errors,
      ...this.getChildFormsErrors(),
    }).length;

    const controlsHaveErrors = !!Object.values({
      ...this.formGroupDirective.form.controls,
      ...this.getChildFormsControls(),
    }).some((control) => control.invalid);
    return formHasErrors || controlsHaveErrors;
  }

  getFormErrors() {
    return Object.entries({
      ...this.formGroupDirective.form.errors,
      ...this.getChildFormsErrors(),
    }).reduce((formErrors, entry) => {
      if (isCanNotBeLessGreaterError(entry)) {
        const [_, canNotBeLessGreaterError] = entry;
        const {
          type,
          lessGreaterField,
          lessGreaterValue,
          comparation,
          thanField,
          thanValue,
        } = canNotBeLessGreaterError;

        const errorMessage = this.translatePipe.transform(
          `IMP_FORM_ERRORS.${
            type === CanNotBeLessGreaterType.NumbersCanNotBe
              ? 'numbers'
              : 'dates'
          }.canNotBe.${comparation}`,
          {
            lessGreaterField:
              this.getCorrectTranslation(lessGreaterField) ?? lessGreaterField,
            lessGreaterValue,
            thanField: this.getCorrectTranslation(thanField) ?? thanField,
            thanValue,
          }
        );

        return formErrors.concat(errorMessage);
      } else if (isIfIsTruthyThenIsRequiredError(entry)) {
        const [_, ifIsTruthyThenIsRequiredError] = entry;
        const { truthyField, requiredField } = ifIsTruthyThenIsRequiredError;

        const errorMessage = this.translatePipe.transform(
          'IMP_FORM_ERRORS.ifIsTruthyThenIsRequired',
          {
            truthyField: this.getCorrectTranslation(truthyField) ?? truthyField,
            requiredField:
              this.getCorrectTranslation(requiredField) ?? requiredField,
          }
        );

        return formErrors.concat(errorMessage);
      } else if (isIfThisIsThenThatIsRequiredError(entry)) {
        const [_, ifThisIsThenThatCanNotBeZeroError] = entry;
        const { thisField, thisValue, thatField, thisValueMapper } =
          ifThisIsThenThatCanNotBeZeroError;
        const errorMessage = this.translatePipe.transform(
          'IMP_FORM_ERRORS.ifThisIsThenThatIsRequired',
          {
            thisField: this.getCorrectTranslation(thisField) ?? thisField,
            thisValue: thisValueMapper(thisValue),
            thatField: this.getCorrectTranslation(thatField) ?? thatField,
          }
        );

        return formErrors.concat(errorMessage);
      } else if (isIfThisIsThenThatCanNotBeZeroError(entry)) {
        const [_, ifThisIsThenThatCanNotBeZeroError] = entry;

        const { thisField, thisValue, thatField, thisValueMapper } =
          ifThisIsThenThatCanNotBeZeroError;

        const errorMessage = this.translatePipe.transform(
          'IMP_FORM_ERRORS.ifThisIsThenThatCanNotBeZero',
          {
            thisField: this.getCorrectTranslation(thisField) ?? thisField,
            thisValue: thisValueMapper(thisValue),
            thatField: this.getCorrectTranslation(thatField) ?? thatField,
          }
        );

        return formErrors.concat(errorMessage);
      } else if (isAtLeastOneFieldError(entry)) {
        const [_, atLeastOneFieldError] = entry;

        const errorMessage = this.translatePipe.transform(
          'IMP_FORM_ERRORS.atLeastOneField',
          {
            fields: atLeastOneFieldError.fields
              .map((field) => this.resolveTranslation(field) ?? field)
              .join(','),
          }
        );

        return formErrors.concat(errorMessage);
      } else if (typeof entry[1] === 'string') {
        const [_, errorValue] = entry;
        return formErrors.concat(errorValue);
      }

      return formErrors;
    }, [] as string[]);
  }

  getControlsWithErrors() {
    return Object.entries({
      ...this.formGroupDirective.form.controls,
      ...this.getChildFormsControls(),
    })
      .filter(([name, control]) => control.invalid)
      .reduce<
        ImpFormErrorsTemplateDirectiveContext['$implicit']['controlsWithErrors']
      >((acc, [name, control]) => {
        if (!control.errors) return acc;
        const errors = Object.entries(control.errors).map(([name, value]) => ({
          name,
          value,
        }));
        let label = name;
        label = this.getCorrectTranslation(name) ?? name;
        return acc.concat({ label, errors });
      }, []);
  }

  private getCorrectTranslation(field: string) {
    const translation = this.translations?.[field];
    if (typeof translation === 'string') {
      return translation;
    } else if (translation?.label) {
      return translation.label;
    } else if (translation?.header) {
      return translation.header;
    }
    return null;
  }

  private getChildFormsErrors() {
    return this.childForms.reduce((acc, form) => {
      const formErrors = form.errors;

      if (formErrors) {
        Object.keys(formErrors).forEach((errorKey) => {
          acc[errorKey] = formErrors[errorKey];
        });
      }

      return acc;
    }, {} as ValidationErrors);
  }

  private getChildFormsControls() {
    return this.childForms.reduce(
      (acc, form) => {
        const formControls = form.controls;

        if (formControls) {
          Object.keys(formControls).forEach((controlKey) => {
            acc[controlKey] = formControls[controlKey];
          });
        }

        return acc;
      },
      {} as {
        [key: string]: AbstractControl<any, any>;
      }
    );
  }

  private resolveTranslation(field: string) {
    let label = field;
    const translation = this.translations?.[field];
    if (typeof translation === 'string') {
      label = translation;
    } else if (translation?.label) {
      label = translation.label;
    } else if (translation?.header) {
      label = translation.header;
    }
    return label;
  }
}
