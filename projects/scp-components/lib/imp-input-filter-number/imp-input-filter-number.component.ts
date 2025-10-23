import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import {
  combineLatest,
  defer,
  distinctUntilChanged,
  filter,
  map,
  merge,
  Observable,
  ReplaySubject,
  shareReplay,
  skip,
  startWith,
  Subject,
  take,
} from 'rxjs';
import { ImpDisabledDirective } from '../forms/directives/imp-disabled.directive';
import { ImperiaTableColumn } from '../imperia-table/models/imperia-table-columns.models';
import { ImpLabelComponent } from '../imp-label/imp-label.component';
import { ImpToggleComponent } from '@imperiascm/scp-components/imp-toggle';
import { FilterOperator } from '@imperiascm/scp-utils/payload';
import { ImpTranslateService } from '@imperiascm/translate';
import { ImpInputNumberComponent } from '../primeng/imp-input-number/imp-input-number.component';

@Component({
  selector: 'imp-input-filter-number',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    CalendarModule,
    ImpLabelComponent,
    InputSwitchModule,
    ImpInputNumberComponent,
    ImpDisabledDirective,
    ImpToggleComponent,
  ],
  templateUrl: './imp-input-filter-number.component.html',
  styleUrl: './imp-input-filter-number.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpInputFilterNumberComponent<TItem extends object> {
  //#region TRANSLATIONS
  public TRANSLATIONS =
    this.typedTranslateService.translation.IMPERIA_TABLE_FILTERS.types.number;
  //#endregion TRANSLATIONS

  //#region INPUTS
  @Input('filterValue') set filterValueSetter(v: any) {
    this.filterValue.next(v);
  }
  public filterValue = new ReplaySubject<any>(1);

  @Input('filterOperator') set filterOperatorSetter(
    v: FilterOperator | undefined
  ) {
    if (!v) return;
    this.filterOperator.next(v);
  }
  public filterOperator = new ReplaySubject<FilterOperator>(1);

  @Input('col') set colSetter(v: ImperiaTableColumn<TItem, 'number'>) {
    this.col.next(v);
  }
  public col = new ReplaySubject<ImperiaTableColumn<TItem, 'number'>>(1);

  public $disabled = input<boolean>(false, { alias: 'disabled' });
  //#endregion INPUTS

  //#region DATE MODE DISPLAY
  public numberDisplay = new Subject<1 | 2>();
  public numberDisplay$ = merge(
    this.filterValue.pipe(
      take(1),
      map((value) => (value && value.toString().includes('@') ? 2 : 1))
    ),
    this.numberDisplay
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion DATE MODE DISPLAY

  //#region OPERATOR
  public onOperatorChange = new Subject<FilterOperator>();
  @Output('operatorChange') operator$ = merge(
    this.onOperatorChange,
    this.numberDisplay$.pipe(
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
  public dateOperatorChange = new Subject<string>();
  public dateOperatorChange$ = this.dateOperatorChange.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion DATE WITH OPERATOR

  //#region VALUE
  public value$ = merge(
    this.filterValue.pipe(take(1)),
    this.numberDisplay$.pipe(
      skip(1),
      distinctUntilChanged(),
      map(() => null)
    ),
    this.dateOperatorChange$,
    defer(() => this.onValueBetweenChanges$)
  ).pipe(
    map((value) => value),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public onValueChange = new Subject<any>();
  @Output('onValueChanges') valueChanges$ = merge(
    this.value$,
    this.onValueChange
  ).pipe(
    map((value) => value),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion VALUE

  //#region BETWEEN SELECTOR
  public rangeStartChanges = new Subject<number>();
  public rangeStart$ = merge(
    this.numberDisplay$.pipe(map(() => null)),
    this.rangeStartChanges,
    this.value$.pipe(
      take(1),
      filter((value) => !!value),
      map((value) => value.split('@')[0])
    )
  ).pipe(
    distinctUntilChanged(),
    startWith(null),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  public rangeEndChanges = new Subject<number>();
  public rangeEnd$ = merge(
    this.numberDisplay$.pipe(map(() => null)),
    this.rangeEndChanges,
    this.value$.pipe(
      take(1),
      filter((value) => !!value),
      map((value) => value.split('@')[1])
    )
  ).pipe(
    distinctUntilChanged(),
    startWith(null),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  public onValueBetweenChanges$: Observable<string> = combineLatest([
    this.rangeStart$,
    this.rangeEnd$,
  ]).pipe(
    filter(
      ([rangeStart, rangeEnd]) =>
        rangeStart !== null &&
        rangeEnd !== null &&
        rangeStart !== undefined &&
        rangeEnd !== undefined
    ),
    map(([rangeStart, rangeEnd]) => `${rangeStart}@${rangeEnd}`),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  //#endregion BETWEEN SELECTOR

  constructor(public typedTranslateService: ImpTranslateService) {}
}
