import { BooleanInput } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  input,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { CURRENCY_CODE, LOCALE } from '@imperiascm/scp-utils/functions';
import { InputNumber, InputNumberModule } from 'primeng/inputnumber';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  map,
  ReplaySubject,
} from 'rxjs';

export type ImpInputNumberModes = 'decimal' | 'currency';

export class ImpInputMinMax {
  min: number | null = null;
  max: number | null = null;
  minFractionDigits: number | null = null;
  maxFractionDigits: number | null = null;
}

@Component({
  selector: 'imp-input-number',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule],
  templateUrl: './imp-input-number.component.html',
  styleUrls: ['./imp-input-number.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ImpInputNumberComponent,
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpInputNumberComponent
  implements ControlValueAccessor, OnChanges
{
  public readonly LOCALE = LOCALE();
  public readonly CURRENCY = CURRENCY_CODE();
  @ViewChild(InputNumber) set inputSetter(v: InputNumber | undefined) {
    if (!v) return;
    this.input.next(v);
  }
  private input: ReplaySubject<InputNumber> = new ReplaySubject<InputNumber>(1);

  //#region INPUTS
  @Input() mode: ImpInputNumberModes = 'decimal';
  private get isCurrency() {
    return this.mode === 'currency';
  }
  @Input() prefix: string = '';
  @Input() suffix: string = '';
  @Input() step: number = 0;
  @Input() useGrouping: boolean = true;
  @Input() isLink: boolean = false;
  @Input() placeholder: string = '';
  public $emitNullOnEmpty = input<boolean>(false, { alias: 'emitNullOnEmpty' });
  public inputStyle = new ReplaySubject<{ [key: string]: string }>(1);
  @Input('inputStyle') set inputStyleSetter(
    value: { [key: string]: string } | null
  ) {
    if (!value) {
      return;
    }
    this.inputStyle.next(value);
  }
  //#endregion INPUTS

  //#region OUTPUTS
  @Output() onClickLink: EventEmitter<void> = new EventEmitter<void>();
  @Output() onBlur: EventEmitter<void> = new EventEmitter<void>();
  @Output() onKeyDown: EventEmitter<KeyboardEvent> =
    new EventEmitter<KeyboardEvent>();

  @Output() onInputChange: EventEmitter<{ value: number | null }> =
    new EventEmitter<{ value: number | null }>();
  //#endregion OUTPUTS

  //#region PRIVATE VARIABLES
  @Input('disabled') set disabledSetter(value: BooleanInput) {
    if (value === null || value === undefined) {
      value = true;
    }
    this.disabled.next(!!value);
  }
  private disabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  //#endregion PRIVATE VARIABLES

  //#region VALUE
  public value: BehaviorSubject<number | null> = new BehaviorSubject<
    number | null
  >(null);
  private onChange = (value: number | null) => {};
  private onTouch = () => {};
  //#endregion VALUE

  //#region MIN MAX
  @Input() minFractionDigits: number | null = null;
  @Input() maxFractionDigits: number | null = null;
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  private minMax = new BehaviorSubject<ImpInputMinMax>(new ImpInputMinMax());
  //#endregion MIN MAX

  //#region VIEWMODEL
  vm$ = combineLatest([this.disabled, this.value, this.minMax]).pipe(
    map(
      ([
        disabled,
        value,
        { max, maxFractionDigits, min, minFractionDigits },
      ]) => ({
        disabled,
        value,
        max,
        maxFractionDigits:
          maxFractionDigits ?? (this.isCurrency ? 2 : maxFractionDigits),
        min,
        minFractionDigits:
          minFractionDigits ?? (this.isCurrency ? 2 : minFractionDigits),
      })
    )
  );
  //#endregion VIEWMODEL

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['min'] ||
      changes['max'] ||
      changes['minFractionDigits'] ||
      changes['maxFractionDigits']
    ) {
      this.minMax.next({
        min: this.min,
        max: this.max,
        minFractionDigits: this.minFractionDigits,
        maxFractionDigits: this.maxFractionDigits,
      });
    }
  }

  onNgModelChange(event: number | null) {
    const value = event === null ? null : Number(event);
    if (
      ((value !== null && isNaN(value)) || value === null) &&
      !this.$emitNullOnEmpty()
    )
      return;
    this.value.next(value);
    this.onChange(value);
    this.onTouch();
  }

  writeValue(value: number): void {
    this.value.next(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.next(isDisabled);
  }

  @HostListener('focus')
  public async focus() {
    const input = await firstValueFrom(this.input);
    input.input.nativeElement.select();
  }

  onBlurFn() {
    this.onBlur.next();
  }
  onKeyDonwFn(event: KeyboardEvent) {
    this.onKeyDown.next(event);
  }
}
