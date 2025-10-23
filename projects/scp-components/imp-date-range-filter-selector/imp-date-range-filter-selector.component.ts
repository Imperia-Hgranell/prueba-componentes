import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  merge,
  ReplaySubject,
  shareReplay,
  Subject,
  take,
  tap,
} from 'rxjs';
import { ImpInputCalendarComponent } from '@imperiascm/scp-components/imp-input-calendar';
import { ImpTranslateService } from '@imperiascm/translate';

@Component({
  selector: 'imp-date-range-filter-selector',
  standalone: true,
  imports: [CommonModule, ImpInputCalendarComponent, FormsModule],
  templateUrl: './imp-date-range-filter-selector.component.html',
  styleUrls: ['./imp-date-range-filter-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpDateRangeFilterSelectorComponent {
  //#region TRANSLATIONS
  public TRANSLATIONS =
    this.typedTranslateService.translation.IMPERIA_TABLE_FILTERS.types.date;
  //#endregion TRANSLATIONS

  //#region INPUT
  @Input('value') set valueSetter(v: any) {
    if (!v) return;
    this.value$.next(v);
  }
  public value$ = new ReplaySubject<any>(1);
  //#endregion INPUT

  //#region OUTPUT
  @Output() onDateChanges = new EventEmitter<any>();

  //#endregion OUTPUT

  //#region DATE START
  dateStartChanges = new Subject<Date>();
  public dateStart$ = merge(
    this.dateStartChanges,
    this.value$.pipe(
      take(1),
      filter((value) => !!value),
      map((value) => value.split('@')[0]),
      map((value) => moment(value, 'YYYY-MM-DD').utc(true).toDate())
    )
  ).pipe(
    distinctUntilChanged(),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  //#endregion DATE START

  //#region DATE END
  dateEndChanges = new Subject<Date>();
  public dateEnd$ = merge(
    this.dateEndChanges,
    this.value$.pipe(
      take(1),
      filter((value) => !!value),
      map((value) => value.split('@')[1]),
      map((value) => moment(value, 'YYYY-MM-DD').utc(true).toDate())
    )
  ).pipe(
    distinctUntilChanged(),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  //#endregion DATE END

  //#region DATE RANGE CHANGES
  public onDateChanges$ = combineLatest([this.dateStart$, this.dateEnd$]).pipe(
    filter(([dateStart, dateEnd]) => !!dateStart && !!dateEnd),
    map(
      ([dateStart, dateEnd]) =>
        `${dateStart.toISOString()}@${dateEnd.toISOString()}`
    ),
    tap((value) => this.onDateChanges.emit(value)),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  //#endregion DATE RANGE CHANGES

  constructor(public typedTranslateService: ImpTranslateService) {}
}
