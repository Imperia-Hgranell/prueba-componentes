import { BooleanInput } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  input,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { LOCALE } from '@imperiascm/scp-utils/functions';
import moment from 'moment';
import { Calendar, CalendarModule, CalendarTypeView } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  map,
  ReplaySubject,
} from 'rxjs';
import { UseUtcDirective } from './imp-input-calendar-utc.directive';

export type IMIN_DATE = Date | null | 'today' | 'startOfMonth';
export type IMAX_DATE = Date | null | 'today' | 'startOfMonth';

@Component({
  selector: 'imp-input-calendar',
  imports: [
    CommonModule,
    FormsModule,
    InputNumberModule,
    CalendarModule,
    UseUtcDirective,
  ],
  templateUrl: './imp-input-calendar.component.html',
  styleUrls: ['./imp-input-calendar.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ImpInputCalendarComponent,
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpInputCalendarComponent implements ControlValueAccessor {
  public readonly LOCALE = LOCALE();
  @ViewChild(Calendar) set inputSetter(v: Calendar | undefined) {
    if (!v) return;
    this.input.next(v);
  }
  private input: ReplaySubject<Calendar> = new ReplaySubject<Calendar>(1);

  //#region INPUTS
  @Input() firstDayOfWeek: number = 1;
  @Input() readonlyInput: boolean = false;
  @Input() showTime: boolean = false;
  @Input() showSeconds: boolean = false;
  @Input() timeOnly: boolean = false;
  @Input() inline: boolean = false;
  @Input() disabledDays: number[] = [];
  @Input() view: CalendarTypeView = 'date';
  @Input() appendTo: string | null = null;
  @Input() dateFormat: string = 'dd/mm/yy';
  @Input() defaultDate: Date | null = null;
  @Input() isInvalid: boolean = false;
  @Input() set minDate(value: IMIN_DATE) {
    this.setMinMaxDate(value, 'min');
  }
  @Input() set maxDate(value: IMAX_DATE) {
    this.setMinMaxDate(value, 'max');
  }
  @Input() useUtc: boolean = true;
  public $disabledDays = input<number[]>([], { alias: 'disabledDays' });
  public _minDate: Date | null = null;
  public _maxDate: Date | null = null;
  //#endregion INPUTS

  //#region OUTPUTS
  @Output() onClickLink: EventEmitter<void> = new EventEmitter<void>();
  @Output() onSelect: EventEmitter<Date> = new EventEmitter<Date>();

  public selectChange(v: Date) {
    if (this.showTime) {
      this.onInput(v);
    }
    this.onSelect.emit(v);
  }
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
  public value: BehaviorSubject<Date | null> = new BehaviorSubject<Date | null>(
    null
  );
  private onChange = (value: Date | null) => {};
  private onTouch = () => {};
  //#endregion VALUE

  //#region VIEWMODEL
  vm$ = combineLatest([this.disabled, this.value]).pipe(
    map(([disabled, value]) => ({
      disabled,
      value,
    }))
  );
  //#endregion VIEWMODEL

  constructor() {}

  onInput(value: Date | null) {
    this.value.next(value);
    this.onChange(value);
    this.onTouch();
  }

  writeValue(value: Date | string | null): void {
    if (!value) {
      this.value.next(null);
      return;
    }
    if (typeof value === 'string') {
      value = new Date(value);
    }
    if (moment(value).isValid()) {
      this.value.next(value);
      return;
    }
    this.value.next(null);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
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
    input.toggle();
  }

  private setMinMaxDate(
    value: IMIN_DATE | IMAX_DATE,
    type: 'min' | 'max'
  ): void {
    const isMin = type === 'min';
    const today = new Date();
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();

    switch (value) {
      case 'today':
        isMin ? (this._minDate = today) : (this._maxDate = today);
        break;
      case 'startOfMonth':
        isMin ? (this._minDate = startOfMonth) : (this._maxDate = endOfMonth);
        break;
      default:
        isMin ? (this._minDate = value) : (this._maxDate = value);
    }
  }
}
