import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';

export type ImpButton<TSelectItem extends object> = TSelectItem &
  Partial<
    Omit<
      ImperiaIconButtonComponent,
      'type' | 'onClick' | 'onClickEvent' | 'hasIcon' | 'active' | 'disabled'
    >
  >;

type ImpSelectButtonComponentValue<TSelectItem extends object> =
  | TSelectItem
  | TSelectItem[keyof TSelectItem]
  | null;

@Component({
  selector: 'imp-select-button',
  standalone: true,
  imports: [CommonModule, ImperiaIconButtonComponent],
  templateUrl: './imp-select-button.component.html',
  styleUrls: ['./imp-select-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ImpSelectButtonComponent,
      multi: true,
    },
  ],
})
export class ImpSelectButtonComponent<TSelectItem extends object>
  implements ControlValueAccessor
{
  @Input() options: ImpButton<TSelectItem>[] | null = null;
  @Input() valueProperty: keyof TSelectItem = 'value' as keyof TSelectItem;
  @Input() activeButtonStyle: { [key: string]: string } | null = null;
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';

  public defaultIcon: ImperiaIconButtonComponent =
    new ImperiaIconButtonComponent();

  private value =
    new BehaviorSubject<ImpSelectButtonComponentValue<TSelectItem> | null>(
      null
    );

  public value$ = this.value.asObservable();

  private onChange = (value: ImpSelectButtonComponentValue<TSelectItem>) => {};
  private onTouch = () => {};

  @Input('disabled') set disabledSetter(v: boolean | null) {
    this.disabled.next(!!v);
  }
  @Output('disabledChange') public disabled = new BehaviorSubject<boolean>(
    false
  );

  constructor() {}

  public select(option: ImpButton<TSelectItem>): void {
    this.value.next(option[this.valueProperty]);
    this.onChange(option[this.valueProperty]);
    this.onTouch();
  }

  public isSelected(
    option: ImpButton<TSelectItem>,
    value: ImpSelectButtonComponentValue<TSelectItem>
  ): boolean {
    return option[this.valueProperty] === value;
  }

  writeValue(newValue: ImpSelectButtonComponentValue<TSelectItem>): void {
    this.value.next(newValue);
  }

  registerOnChange(
    fn: (value: ImpSelectButtonComponentValue<TSelectItem>) => void
  ): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.next(isDisabled);
  }
}
