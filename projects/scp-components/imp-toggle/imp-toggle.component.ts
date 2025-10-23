import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IMP_TOGGLE } from './animations/toggle-animations';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'imp-toggle',
  standalone: true,
  imports: [CommonModule],
  animations: [IMP_TOGGLE],
  templateUrl: './imp-toggle.component.html',
  styleUrl: './imp-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ImpToggleComponent,
      multi: true,
    },
  ],
})
export class ImpToggleComponent implements ControlValueAccessor {
  //#region VALUE
  public toggled = new ReplaySubject<boolean | number | string>(1);
  //#endregion VALUE

  //#region INPUTS
  $trueValue = input<boolean | number | string>(true, {
    alias: 'trueValue',
  });

  $falseValue = input<boolean | number | string>(false, {
    alias: 'falseValue',
  });

  $toggleColor = input<string | null>(null, {
    alias: 'toggleColor',
  });

  $disabled = input<boolean>(false, {
    alias: 'disabled',
  });

  //#endregion INPUTS

  //#region OUTPUTS
  @Output('onToggle') public readonly toggled$ = this.toggled.asObservable();
  //#endregion OUTPUTS

  public onChange = (value: boolean | number | string) => {};
  public onTouched = () => {};

  public writeValue(value: boolean | number | string | null): void {
    if (value === null) return;
    this.toggled.next(value);
  }

  public registerOnChange(
    fn: (value: boolean | number | string) => void
  ): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public toggle(
    value: boolean | number | string | null,
    isDisabled: boolean
  ): void {
    if (value === null || isDisabled) return;
    const valueToToggle =
      value === this.$trueValue() ? this.$falseValue() : this.$trueValue();
    this.toggled.next(valueToToggle);
    this.onChange(valueToToggle);
    this.onTouched();
  }
}
