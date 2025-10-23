import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Optional,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { withValueFrom } from '@imperiascm/rxjs-utils';
import { isHierarchyKey } from '@imperiascm/scp-utils/models';
import {
  COMPONENT_OPEN_CLOSE,
  HORIZONTAL_ELEMENT_ENTER_LEAVE,
  HORIZONTAL_LIST_ELEMENT_ENTER_LEAVE,
  PANEL_OPEN_CLOSE,
} from './imperia-table-filter-v2.animations';
import { ImperiaTableV2Component } from '../imperia-table-v2/imperia-table-v2.component';
import { ImperiaTableColumn } from '../../models/imperia-table-columns.models';
import { ImperiaTableFilterValue } from '../../models/imperia-table-filters.models';
import {
  getFiltersFromStorage,
  setFiltersToStorage,
} from '../../shared/functions';
import { ImperiaTableHeaderCellContextMenuContext } from '../../template-directives/imperia-table-header-cell-context-menu-template.directive';
import { normalizeString } from '@imperiascm/scp-utils/functions';
import { FilterOperator } from '@imperiascm/scp-utils/payload';
import dayjs from 'dayjs/esm';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subject,
  animationFrameScheduler,
  combineLatest,
  combineLatestWith,
  debounceTime,
  defer,
  delay,
  distinctUntilChanged,
  filter,
  map,
  merge,
  mergeWith,
  of,
  pairwise,
  share,
  shareReplay,
  skip,
  startWith,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';
import { LocalizedDatePipe } from '@imperiascm/scp-components/pipes';

@Component({
  selector: 'imperia-table-filter-v2',
  templateUrl: './imperia-table-filter-v2.component.html',
  styleUrls: ['./imperia-table-filter-v2.component.scss'],
  animations: [
    COMPONENT_OPEN_CLOSE,
    PANEL_OPEN_CLOSE,
    HORIZONTAL_LIST_ELEMENT_ENTER_LEAVE,
    HORIZONTAL_ELEMENT_ENTER_LEAVE,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableFilterV2Component<TItem extends object> {
  //#region VIEWCHILD
  @ViewChild('headerCellIconsTemplate')
  headerCellFilterIconsTemplate!: TemplateRef<
    ImperiaTableHeaderCellContextMenuContext<TItem>
  >;
  //#endregion VIEWCHILD

  //#region READONLY
  public readonly differentOperator = FilterOperator.NOT_EQUAL;
  public readonly equalOperator = FilterOperator.EQUAL;
  //#endregion READONLY

  //#region FILTERS
  @Input('filters') set filtersSetter(v: ImperiaTableColumn<TItem>[] | null) {
    if (!v) return;
    this.filters.next(v);
  }
  private filters: ReplaySubject<ImperiaTableColumn<TItem>[]> =
    new ReplaySubject<ImperiaTableColumn<TItem>[]>(1);
  public filters$: Observable<ImperiaTableColumn<TItem>[]> = defer(() =>
    !!this.table
      ? merge(this.table.columns, this.table.columnsFromDirectives$)
      : this.filters
  ).pipe(map((columns) => columns.filter(({ allowFilter }) => allowFilter)));
  //#endregion FILTERS

  //#region CONFIGURATION PANEL VISIBILITY
  public toggleConfigurationPanel = new Subject<void>();
  public configurationPanelVisibility$: Observable<boolean> =
    this.toggleConfigurationPanel.pipe(
      switchMap(() =>
        this.configurationPanelVisibility$.pipe(
          take(1),
          map((v) => !v)
        )
      ),
      startWith(false),
      shareReplay({
        bufferSize: 1,
        refCount: true,
      })
    );
  //#endregion CONFIGURATION PANEL VISIBILITY

  //#region TOGGLE APPLY FILTERS AUTOMATICALLY
  public toggleApplyFiltersAutomatically = new Subject<void>();
  public applyFiltersAutomatically$: Observable<boolean> = merge(
    this.toggleApplyFiltersAutomatically.pipe(
      switchMap(() =>
        this.applyFiltersAutomatically$.pipe(
          take(1),
          map((v) => !v)
        )
      ),
      map((visible) => visible)
    )
  ).pipe(startWith(true), shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion TOGGLE APPLY FILTERS AUTOMATICALLY

  //#region TOGGLE CROSS HIERARCHY FILTERS
  public toggleCrossHierarchyFilters = new Subject<void>();
  public crossHierarchyFilters$: Observable<boolean> = merge(
    this.toggleCrossHierarchyFilters.pipe(
      switchMap(() =>
        this.crossHierarchyFilters$.pipe(
          take(1),
          map((v) => !v)
        )
      ),
      map((visible) => visible)
    )
  ).pipe(startWith(true), shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion TOGGLE CROSS HIERARCHY FILTERS

  //#region SELECTEDS FILTERS FROM STORAGE
  @Input('storageKey') set storageKeySetter(v: string | null | undefined) {
    if (!v) return;
    this.storageKey.next(v);
  }
  private storageKey = new ReplaySubject<string>(1);
  private storageKey$ = defer(() =>
    !!this.table ? this.table.storageKey : this.storageKey
  ).pipe(distinctUntilChanged(), startWith(''));
  private selectedFiltersValueFromStorage$ = defer(() =>
    !!this.table
      ? this.table.storage$.pipe(map(({ Filters }) => Filters))
      : this.storageKey.pipe(map(getFiltersFromStorage<TItem>))
  ).pipe(startWith([] as ImperiaTableFilterValue<TItem, string>[]));
  //#endregion SELECTEDS FILTERS FROM STORAGE

  //#region SELECTED FILTERS FROM INPUT
  @Input('value') set valueSetter(
    v: ImperiaTableFilterValue<TItem, string>[] | null
  ) {
    if (!v) return;
    this.selectedFiltersValueFromInput.next(v);
  }
  private selectedFiltersValueFromInput = new BehaviorSubject<
    ImperiaTableFilterValue<TItem, string>[]
  >([]);
  //#endregion SELECTED FILTERS FROM INPUT

  //#region ON ADD FILTER
  /* @ViewChild('filtersToAddContainer')
  filtersToAddContainer: ElementRef<HTMLDivElement> | null = null; */
  public addFilter = new Subject<ImperiaTableFilterValue<TItem> | string>();
  private onAddFilter$: Observable<ImperiaTableFilterValue<TItem>[]> =
    this.addFilter.pipe(
      filter((filterToAdd) => !!filterToAdd),
      //tap(() => this.filtersToAddContainer?.nativeElement.focus()),
      switchMap((filterToAdd) =>
        filterToAdd instanceof Object
          ? of(filterToAdd)
          : this.filters$.pipe(
              take(1),
              map((columns) =>
                columns.find(({ filterName }) => filterName == filterToAdd)
              ),
              filter((column): column is ImperiaTableColumn<TItem> => !!column),
              map((column) => column.asFilter({ columnAsString: false }))
            )
      ),
      switchMap((filterToAdd) =>
        this.filtersChanges$.pipe(
          take(1),
          map((selected) => [...selected, filterToAdd])
        )
      ),
      share()
    );
  //#endregion ON ADD FILTER

  //#region ON REMOVE FILTER
  public removeFilter = new Subject<string>();
  private onRemoveFilter$: Observable<ImperiaTableFilterValue<TItem>[]> =
    this.removeFilter.pipe(
      switchMap((filterToRemove) =>
        this.filtersChanges$.pipe(
          take(1),
          map((selected) =>
            selected.filter(({ Column }) => Column.filterName != filterToRemove)
          )
        )
      )
    );
  //#endregion ON REMOVE FILTER

  //#region SELECTED FILTERS VALUE
  private withStoragePayload = new BehaviorSubject<boolean>(false);
  @Input('withStoragePayload') set withStoragePayloadSetter(v: boolean | null) {
    if (v === null) return;
    this.withStoragePayload.next(v);
  }
  private selectedFiltersValue$ = merge(
    merge(this.onAddFilter$, this.onRemoveFilter$).pipe(
      map((selected) => selected.map(({ Column }) => Column.asFilter()))
    ),
    combineLatest([
      merge(
        this.selectedFiltersValueFromInput.pipe(
          startWith([]),
          pairwise(),
          filter(([prev, curr]) => !this.areEqual(prev, curr)),
          withValueFrom(this.withStoragePayload),
          filter(([_, withStoragePayload]) => withStoragePayload),
          map(([[_, curr]]) => curr)
        ),
        this.selectedFiltersValueFromInput.pipe(
          withValueFrom(this.withStoragePayload),
          filter(([_, withStoragePayload]) => !withStoragePayload),
          map(([value]) => value)
        )
      ),
      this.selectedFiltersValueFromStorage$,
    ]).pipe(
      map(([fromInput, fromStorage]) => [
        ...fromInput,
        ...fromStorage.filter(
          ({ Column }) => !fromInput.find(({ Column: c }) => c == Column)
        ),
      ])
    )
  ).pipe(
    map((filters) =>
      filters.map((filter) => ({
        ...filter,
        Value:
          filter.Value !== null && filter.Value !== undefined
            ? filter.Value + ''
            : '',
      }))
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  //#endregion SELECTED FILTERS VALUE

  //#region SELECTED FILTERS COLUMNS
  public selectedFilters$ = combineLatest([
    this.filters$,
    this.selectedFiltersValue$,
  ]).pipe(
    map(([columns, selectedFiltersValue]) =>
      columns.reduce<ImperiaTableColumn<TItem>[]>((selectedColumns, col) => {
        const selectedFilterValue = selectedFiltersValue.find(
          ({ Column }) => Column == col.filterName
        );
        if (selectedFilterValue) return selectedColumns.concat(col);
        return selectedColumns;
      }, [])
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion SELECTED FILTERS COLUMNS

  //#region UNSELECTED FILTERS COLUMNS
  public unselectedFilters$ = combineLatest([
    this.filters$,
    this.selectedFiltersValue$,
  ]).pipe(
    map(([columns, selectedFiltersValue]) =>
      columns.filter(
        ({ filterName }) =>
          !selectedFiltersValue.find(({ Column }) => Column == filterName)
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion UNSELECTED FILTERS COLUMNS

  //#region FILTERS CHANGES
  public filtersChanges$ = merge(
    this.selectedFiltersValue$.pipe(
      switchMap((selectedFiltersValue) =>
        this.filters$.pipe(
          take(1),
          map((filters) => ({
            filters,
            selectedFiltersValue,
          }))
        )
      ),
      map(({ filters, selectedFiltersValue }) =>
        filters.reduce<ImperiaTableFilterValue<TItem>[]>(
          (selectedFilters, col) => {
            const selectedFilterValue = selectedFiltersValue.find(
              ({ Column }) => Column == col.filterName
            );
            if (selectedFilterValue) {
              col.setFilters(
                selectedFilterValue.Value,
                selectedFilterValue.Operator
              );
              return [
                ...selectedFilters,
                col.asFilter({ columnAsString: false }),
              ];
            } else {
              col.setFilters(null, FilterOperator.EQUAL);
              return selectedFilters;
            }
          },
          []
        )
      )
    ),
    this.selectedFilters$.pipe(
      switchMap((selected) =>
        combineLatest(selected.map((col) => this.filterChange$(col))).pipe(
          skip(1)
        )
      )
    )
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  private filterChange$(col: ImperiaTableColumn<TItem>) {
    return combineLatest([
      col.filterValueChange$,
      col.filterOperatorChange$,
    ]).pipe(
      map(
        ([value, operator]) =>
          new ImperiaTableFilterValue<TItem>(col, value, operator)
      )
    );
  }
  //#endregion FILTERS CHANGES

  //#region ADD FILTER PANEL VISIBILITY
  public toggleAddFilterPanel = new Subject<void>();
  public addFilterPanelFocusChange = new Subject<string | null>();
  public addFilterPanelVisibility$: Observable<boolean> = merge(
    this.toggleAddFilterPanel.pipe(
      switchMap(() =>
        this.addFilterPanelVisibility$.pipe(
          take(1),
          map((v) => !v)
        )
      ),
      map((visible) => visible)
    ),
    this.unselectedFilters$.pipe(
      map((unselected) => !!unselected.length),
      filter((v) => !v)
    ) /* ,
    this.addFilterPanelFocusChange.pipe(
      map((v) => !!v),
      filter((v) => !v)
    ) */
  ).pipe(startWith(false), shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion ADD FILTER PANEL VISIBILITY

  //#region FILTERS TO ADD
  public filtersToAddSearch = new Subject<string>();
  public filtersToAdd$ = this.unselectedFilters$.pipe(
    combineLatestWith(this.filtersToAddSearch.pipe(startWith(''))),
    map(([filters, search]) =>
      filters.filter(({ header }) =>
        normalizeString(header)
          .toLowerCase()
          .includes(normalizeString(search).toLowerCase())
      )
    )
  );
  //#endregion FILTERS TO ADD

  //#region APPLY FILTERS
  public applyFilters = new Subject<void>();
  @Output() onFilterChanges: EventEmitter<
    ImperiaTableFilterValue<TItem, string>[]
  > = new EventEmitter<ImperiaTableFilterValue<TItem, string>[]>();
  private lastFiltersToApply$ = this.filtersChanges$.pipe(
    debounceTime(300),
    withLatestFrom(this.storageKey$),
    tap(([filters, storageKey]) =>
      setFiltersToStorage(
        storageKey,
        filters.map(({ Column }) => Column.asFilter())
      )
    ),
    map(([filters]) => filters),
    map((filters) => this.removeInvalidFilters(filters)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public lastAppliedFilters$ = merge(
    this.lastFiltersToApply$.pipe(
      withLatestFrom(this.applyFiltersAutomatically$),
      filter(([_, applyAutomatically]) => applyAutomatically),
      map(([filters]) => ({ filters, from: 'applyAutomatically' }))
    ),
    this.applyFilters.pipe(
      withLatestFrom(this.lastFiltersToApply$),
      map(([_, filters]) => ({ filters, from: 'applyButton' }))
    )
  ).pipe(
    startWith({ filters: [], from: 'start' }),
    pairwise(),
    filter(
      ([prev, curr]) =>
        prev.from == 'start' ||
        curr.from == 'applyButton' ||
        !this.areEqual(prev.filters, curr.filters)
    ),
    map(([_, curr]) => curr.filters),
    tap((filters) =>
      this.onFilterChanges.emit(
        filters.map(({ Column }) => {
          const filter = Column.asFilter({
            valueAsString: true,
          });
          if (
            Column.dataInfo.type === 'date' &&
            !filter.Value.toString().includes('@')
          ) {
            filter.Value = dayjs(filter.Value + '').format('YYYY/MM/DD');
          }
          return filter;
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public toApplyAndLastAppliedAreEqual$: Observable<boolean> = combineLatest([
    this.lastFiltersToApply$,
    this.lastAppliedFilters$,
  ]).pipe(
    map(([toApply, applied]) => this.areEqual(toApply, applied)),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public applyFiltersDebounce$ = merge(
    this.applyFilters.pipe(map(() => true)),
    this.applyFilters.pipe(
      debounceTime(1000),
      delay(0, animationFrameScheduler),
      map(() => false)
    )
  );
  private removeInvalidFilters(filters: ImperiaTableFilterValue<TItem>[]) {
    return filters.filter(({ Value }) => {
      if (Array.isArray(Value) && Value.length === 0) return false;
      if ([null, undefined, 'null', 'undefined', ''].some((v) => v === Value))
        return false;
      return true;
    });
  }
  //#endregion APPLY FILTERS

  //#region HIERARCHY FILTERS
  public hierarchyFilters$ = this.crossHierarchyFilters$.pipe(
    switchMap((crossHierarchyFilters) =>
      crossHierarchyFilters
        ? this.lastFiltersToApply$.pipe(
            map((filters) =>
              filters.filter(({ Column }) => isHierarchyKey(Column.filterName))
            ),
            map((filters) => filters.map(({ Column }) => Column.asFilter())),
            shareReplay({
              bufferSize: 1,
              refCount: true,
            })
          )
        : of([])
    ),
    startWith<ImperiaTableFilterValue<TItem, string>[]>([]),
    pairwise(),
    filter(([prev, curr]) => !this.areEqual(prev, curr)),
    map(([_, curr]) => curr!)
  );
  //#endregion HIERARCHY FILTERS

  //#region OPENED
  public toggleOpened = new Subject<void>();
  @Input('opened') set openedSetter(v: boolean | null) {
    this.opened.next(!!v);
  }
  private opened = new ReplaySubject<boolean>(1);
  public opened$: Observable<boolean> = defer(() =>
    !!this.table
      ? merge(this.toggleOpened, this.table.toggleFilters)
      : this.toggleOpened
  ).pipe(
    switchMap(() =>
      this.opened$.pipe(
        take(1),
        map((v) => !v)
      )
    ),
    mergeWith(
      this.opened,
      this.lastAppliedFilters$.pipe(
        take(1),
        map((filters) => !!filters.length)
      ),
      this.onAddFilter$.pipe(map(() => true))
    ),
    tap((v) => this.openedChange.emit(v)),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  @Output() openedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  //#endregion OPENED

  constructor(
    @Optional() private table: ImperiaTableV2Component<TItem> | null,
    private datePipe: LocalizedDatePipe
  ) {}

  public onPaste(event: ClipboardEvent, column: ImperiaTableColumn<TItem>) {
    event.preventDefault();
    const { clipboardData } = event;
    if (!clipboardData) return;
    const text = clipboardData.getData('text');
    if (!text) return;
    const textWithCommas = text.split(/[\r\n]+/g).join(';');
    column.setFilters(textWithCommas, FilterOperator.EQUAL);
  }

  public filterTrackByFn(_: number, col: ImperiaTableColumn<TItem>) {
    return col.filterName;
  }

  private areEqual(
    filtersA: ImperiaTableFilterValue<
      TItem,
      string | ImperiaTableColumn<TItem>
    >[],
    filtersB: ImperiaTableFilterValue<
      TItem,
      string | ImperiaTableColumn<TItem>
    >[]
  ) {
    if (!filtersA || !filtersB) return false;
    if (filtersA.length != filtersB.length) return false;

    return filtersA.every((filterA) =>
      filtersB.find((filterB) => {
        const AColumn =
          filterA.Column instanceof ImperiaTableColumn
            ? filterA.Column.filterName
            : filterA.Column;
        const BColumn =
          filterB.Column instanceof ImperiaTableColumn
            ? filterB.Column.filterName
            : filterB.Column;
        return (
          AColumn == BColumn &&
          filterA.Value == filterB.Value &&
          filterA.Operator == filterB.Operator
        );
      })
    );
  }
}
