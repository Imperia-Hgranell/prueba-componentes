import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { TIME_TYPES } from './models/imp-time-type.models';
import { ImpTranslatePipe, ImpTranslateService } from '@imperiascm/translate';
import { DropdownModule } from 'primeng/dropdown';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  ReplaySubject,
} from 'rxjs';
import { ImpLabelComponent } from '../imp-label/imp-label.component';

@Component({
  selector: 'imp-time-type',
  standalone: true,
  imports: [
    CommonModule,
    DropdownModule,
    FormsModule,
    ImpLabelComponent,
    ImpTranslatePipe,
  ],
  templateUrl: './imp-time-type.component.html',
  styleUrl: './imp-time-type.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ImpTimeTypeComponent,
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpTimeTypeComponent implements ControlValueAccessor {
  //#region TRANSLATIONS
  private readonly TRANSLATIONS =
    this.typedTranslateService.translation.IMP_TIME_TYPE;
  //#endregion TRANSLATIONS

  //#region DAYS
  @Input('days') set daysSetter(v: boolean | null) {
    if (v === null) return;
    this.days.next(v);
  }
  private days = new BehaviorSubject<boolean>(true);
  //#endregion DAYS

  //#region HOURS
  @Input('hours') set hoursSetter(v: boolean | null) {
    if (v === null) return;
    this.hours.next(v);
  }
  private hours = new BehaviorSubject<boolean>(true);
  //#endregion HOURS

  //#region MINUTES
  @Input('minutes') set minutesSetter(v: boolean | null) {
    if (v === null) return;
    this.minutes.next(v);
  }
  private minutes = new BehaviorSubject<boolean>(true);
  //#endregion MINUTES

  //#region SECONDS
  @Input('seconds') set secondsSetter(v: boolean | null) {
    if (v === null) return;
    this.seconds.next(v);
  }
  private seconds = new BehaviorSubject<boolean>(true);
  //#endregion SECONDS

  //#region OPTIONS
  public options$: Observable<{ Key: TIME_TYPES; Label: string }[]> =
    combineLatest([this.days, this.hours, this.minutes, this.seconds]).pipe(
      map(([days, hours, minutes, seconds]) => {
        const options: { Key: TIME_TYPES; Label: string }[] = [];

        if (seconds)
          options.push({
            Key: TIME_TYPES.Seconds,
            Label: this.TRANSLATIONS.options.seconds,
          });
        if (minutes)
          options.push({
            Key: TIME_TYPES.Minutes,
            Label: this.TRANSLATIONS.options.minutes,
          });
        if (hours)
          options.push({
            Key: TIME_TYPES.Hours,
            Label: this.TRANSLATIONS.options.hours,
          });

        if (days)
          options.push({
            Key: TIME_TYPES.Days,
            Label: this.TRANSLATIONS.options.days,
          });
        return options;
      })
    );
  //#endregion OPTIONS

  //#region VALUE
  public value = new ReplaySubject<TIME_TYPES>(1);
  //#endregion VALUE

  //#region ON CHANGE VALUE
  public onChangeValue(v: { value: TIME_TYPES }): void {
    this.value.next(v.value);
    this.onChange(v.value);
    this.onTouched(v.value);
  }
  //#endregion ON CHANGE VALUE

  //#region DISABLED
  @Input('disabled') set disabledSetter(v: boolean | null) {
    if (v === null) return;
    this.disabled.next(v);
  }
  public disabled = new BehaviorSubject<boolean>(false);
  //#endregion DISABLED

  constructor(private typedTranslateService: ImpTranslateService) {}

  writeValue(v: TIME_TYPES | null): void {
    if (!this.isTimeType(v)) return;
    this.value.next(v);
  }

  private onChange = (v: TIME_TYPES) => {};
  registerOnChange(fn: (v: TIME_TYPES) => void): void {
    this.onChange = fn;
  }

  private onTouched = (v: TIME_TYPES) => {};
  registerOnTouched(fn: (v: TIME_TYPES) => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.next(isDisabled);
  }

  private isTimeType(v: TIME_TYPES | null): v is TIME_TYPES {
    if (v === null) return false;
    return TIME_TYPES[v] !== undefined;
  }
}
