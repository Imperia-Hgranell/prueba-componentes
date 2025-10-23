import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImperiaTableColumn } from '../imperia-table/models/imperia-table-columns.models';
import moment from 'moment';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import {
  distinctUntilChanged,
  filter,
  map,
  merge,
  ReplaySubject,
  shareReplay,
  skip,
  Subject,
  take,
} from 'rxjs';
import { ImpLabelComponent } from '../imp-label/imp-label.component';
import { ImpDateRangeFilterSelectorComponent } from '@imperiascm/scp-components/imp-date-range-filter-selector';
import { FilterOperator } from '@imperiascm/scp-utils/payload';
import { ImpTranslateService } from '@imperiascm/translate';

@Component({
  selector: 'imp-input-filter-date',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    CalendarModule,
    ImpDateRangeFilterSelectorComponent,
    ImpLabelComponent,
    InputSwitchModule,
  ],
  templateUrl: './imp-input-filter-date.component.html',
  styleUrls: ['./imp-input-filter-date.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpInputFilterDateComponent<TItem extends object> {
  //#region TRANSLATIONS
  public TRANSLATIONS =
    this.typedTranslateService.translation.IMPERIA_TABLE_FILTERS.types.date;
  //#endregion TRANSLATIONS

  //#region INPUTS
  @Input('filterValue') set filterValueSetter(v: any) {
    this.filterValue.next(v);
  }
  public filterValue = new ReplaySubject<any>(1);

  @Input('filterOperator') set filterOperatorSetter(v: any) {
    this.filterOperator.next(v);
  }
  public filterOperator = new ReplaySubject<any>(1);

  @Input('col') set colSetter(v: ImperiaTableColumn<TItem, 'date'>) {
    this.col.next(v);
  }
  public col = new ReplaySubject<ImperiaTableColumn<TItem, 'date'>>(1);
  //#endregion INPUTS

  //#region DATE MODE DISPLAY
  public dateDisplay = new Subject<1 | 2>();
  public dateDisplay$ = merge(
    this.filterValue.pipe(
      take(1),
      map((value) => (value && value.toString().includes('@') ? 2 : 1)) //check if value is a date or a rangeDate
    ),
    this.dateDisplay
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion DATE MODE DISPLAY

  //#region OPERATOR
  public onOperatorChange = new Subject<FilterOperator>();
  @Output('operatorChange') operator$ = merge(
    this.onOperatorChange,
    this.dateDisplay$.pipe(
      filter((value) => value === 2),
      map(() => FilterOperator.BETWEEN)
    ),
    this.filterOperator.pipe(take(1))
  ).pipe(
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion OPERATOR

  //#region DATE WITH OPERATOR
  public dateOperatorChange = new Subject<Date>(); // "2024-10-23T00:00:00.000Z"
  public dateOperatorChange$ = this.dateOperatorChange.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion DATE WITH OPERATOR

  //#region DATE WITH RANGE
  public dateRangeChange = new Subject<string>(); // "2024-10-23T00:00:00.000Z@2024-11-23T00:00:00.000Z"
  public dateRangeChange$ = this.dateRangeChange.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#region DATE WITH RANGE

  //#region VALUE
  public value$ = merge(
    this.filterValue.pipe(take(1)),
    this.dateDisplay$.pipe(
      skip(1),
      distinctUntilChanged(),
      map(() => null)
    ),
    this.dateOperatorChange$,
    this.dateRangeChange$
  ).pipe(
    map(
      (value) =>
        value && !value.toString().includes('@')
          ? moment(value).toDate()
          : value //check if value is a date or a rangeDate
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  @Output('onValueChanges') valueChanges$ = this.value$.pipe(
    map(
      (value) =>
        value && !value.toString().includes('@')
          ? moment(value).format('YYYY/MM/DD')
          : value //check if value is a date or a rangeDate
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion VALUE

  constructor(public typedTranslateService: ImpTranslateService) {}
}
