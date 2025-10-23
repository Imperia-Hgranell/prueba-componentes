import { AbstractControl } from '@angular/forms';
import { atLeastOneFieldError } from './errors/atLeastOneField';
import {
  CanNotBeLessGreaterComparation,
  CanNotBeLessGreaterError,
  CanNotBeLessGreaterType,
} from './errors/canNotBeLessGreater';
import { EqualsError } from './errors/equals';
import { IfIsTruthyThenIsRequiredError } from './errors/ifIsTruthyThenIsRequired';
import { IfThisIsThenThatCanNotBeZeroError } from './errors/ifThisIsThenThatCanNotBeZero';
import { IfThisIsThenThatIsRequiredError } from './errors/ifThisIsThenThatIsRequired';
import dayjs from 'dayjs/esm';
import { areAllTruthy } from '@imperiascm/scp-utils/functions';

export function CanNotBeZero(control: AbstractControl) {
  if (control.value === 0) {
    return { canNotBeZero: true };
  }
  return null;
}

export function DatesCanNotBe(
  fieldToBeCompared: string,
  comparation: keyof typeof CanNotBeLessGreaterComparation,
  fieldToCompare: string,
  msgDateFormat: string = 'DD/MM/YYYY'
) {
  return (
    form: AbstractControl
  ):
    | {
        [key in `${CanNotBeLessGreaterType.DatesCanNotBe}${CanNotBeLessGreaterComparation}`]?: CanNotBeLessGreaterError;
      }
    | null => {
    const controlToCompare = form.get(fieldToCompare);
    const controlToBeCompared = form.get(fieldToBeCompared);

    if (
      !controlToCompare ||
      controlToCompare.value === null ||
      controlToCompare.value === undefined
    ) {
      return null;
    }

    if (
      !controlToBeCompared ||
      controlToBeCompared.value === null ||
      controlToBeCompared.value === undefined
    ) {
      return null;
    }

    if (
      comparation == 'GreaterThan'
        ? new Date(controlToBeCompared.value).getTime() >
          new Date(controlToCompare.value).getTime()
        : new Date(controlToBeCompared.value).getTime() <
          new Date(controlToCompare.value).getTime()
    ) {
      return {
        [`DatesCanNotBe${comparation}`]: new CanNotBeLessGreaterError(
          fieldToBeCompared,
          dayjs(controlToBeCompared.value).format(msgDateFormat),
          fieldToCompare,
          dayjs(controlToCompare.value).format(msgDateFormat),
          CanNotBeLessGreaterType.DatesCanNotBe,
          CanNotBeLessGreaterComparation[comparation]
        ),
      };
    }

    return null;
  };
}

export function NumbersCanNotBe(
  fieldToBeCompared: string,
  comparation: keyof typeof CanNotBeLessGreaterComparation,
  fieldToCompare: string
) {
  return (
    form: AbstractControl
  ):
    | {
        [key in `${CanNotBeLessGreaterType.NumbersCanNotBe}${CanNotBeLessGreaterComparation}`]?: CanNotBeLessGreaterError;
      }
    | null => {
    const controlToCompare = form.get(fieldToCompare);
    const controlToBeCompared = form.get(fieldToBeCompared);

    if (
      !controlToCompare ||
      controlToCompare.value === null ||
      controlToCompare.value === undefined
    ) {
      return null;
    }

    if (
      !controlToBeCompared ||
      controlToBeCompared.value === null ||
      controlToBeCompared.value === undefined
    ) {
      return null;
    }

    if (
      comparation == 'GreaterThan'
        ? controlToBeCompared.value > controlToCompare.value
        : controlToBeCompared.value < controlToCompare.value
    ) {
      return {
        [`NumbersCanNotBe${comparation}`]: new CanNotBeLessGreaterError(
          fieldToBeCompared,
          controlToBeCompared.value,
          fieldToCompare,
          controlToCompare.value,
          CanNotBeLessGreaterType.NumbersCanNotBe,
          CanNotBeLessGreaterComparation[comparation]
        ),
      };
    }

    return null;
  };
}

export function IfIsTruthyThenIsRequired<T extends AbstractControl>(
  truthyField: keyof T['value'] & string,
  requiredField: keyof T['value'] & string
) {
  return (
    form: AbstractControl<T>
  ):
    | { [key in 'IfIsTruthyThenIsRequired']: IfIsTruthyThenIsRequiredError }
    | null => {
    const controlTruthy = form.get(truthyField);
    const controlRequired = form.get(requiredField);

    if (
      !controlTruthy ||
      controlTruthy.value === null ||
      controlTruthy.value === undefined
    ) {
      return null;
    }

    if (controlTruthy.value && !controlRequired?.value) {
      return {
        IfIsTruthyThenIsRequired: new IfIsTruthyThenIsRequiredError(
          truthyField,
          requiredField
        ),
      };
    }

    return null;
  };
}

export function IfThisIsThenThatCanNotBeZero<TThisValue = any>(
  thisField: string,
  thisValue: TThisValue,
  thatField: string,
  thisValueMapper?: (value: TThisValue) => any
) {
  return (
    form: AbstractControl
  ):
    | {
        [key in 'IfThisIsThenThatCanNotBeZero']: IfThisIsThenThatCanNotBeZeroError;
      }
    | null => {
    const controlThis = form.get(thisField);
    const controlThat = form.get(thatField);

    if (!controlThis || !controlThat) return null;

    if (controlThis.value === thisValue && controlThat.value === 0) {
      return {
        [`IfThisIsThenThatCanNotBeZero`]: new IfThisIsThenThatCanNotBeZeroError(
          thisField,
          thisValue,
          thatField,
          thisValueMapper ?? ((value) => value)
        ),
      };
    }

    return null;
  };
}

export function atLeastOneFieldValidator(fields: string[]) {
  return (form: AbstractControl) => {
    const hasAtLeastOneField = fields.some((field) => !!form.get(field)?.value);
    return hasAtLeastOneField
      ? null
      : { [`atLeastOneField`]: new atLeastOneFieldError(fields) };
  };
}

export function IfThisIsThenThatIsRequired<TThisValue = any>(
  thisField: string,
  thisValue: TThisValue,
  thatField: string,
  thisValueMapper?: (value: TThisValue) => any
) {
  return (
    form: AbstractControl
  ):
    | {
        [key in 'IfThisIsThenThatIsRequired']: IfThisIsThenThatIsRequiredError;
      }
    | null => {
    const thisControl = form.get(thisField);
    const thatControl = form.get(thatField);
    if (thisControl?.value === thisValue && thatControl?.value === null) {
      return {
        [`IfThisIsThenThatIsRequired`]: new IfThisIsThenThatIsRequiredError(
          thisField,
          thisValue,
          thatField,
          thisValueMapper ?? ((value) => value)
        ),
      };
    }
    return null;
  };
}

export function Equals(...fields: string[]) {
  return (form: AbstractControl) => {
    const controls = fields.map((field) => form.get(field));

    if (areAllTruthy(controls)) {
      return controls.every(({ value }) => value === controls[0].value)
        ? null
        : { [`Equals`]: new EqualsError(fields) };
    }

    return null;
  };
}
