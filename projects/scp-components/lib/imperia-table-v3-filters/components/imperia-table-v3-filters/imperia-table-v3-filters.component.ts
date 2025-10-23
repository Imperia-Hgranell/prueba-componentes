import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  Input,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { toggle, withValueFrom } from '@imperiascm/rxjs-utils';
import { isHierarchyKey } from '@imperiascm/scp-utils/models';
import {
  HORIZONTAL_EXPAND_FADEIN_FADEOUT_COLLAPSE,
  VERTICAL_EXPAND_FADEIN_FADEOUT_COLLAPSE,
} from '@imperiascm/scp-utils/animations';
import { HORIZONTAL_ELEMENT_ENTER_LEAVE, HORIZONTAL_LIST_ELEMENT_ENTER_LEAVE } from '../../../imperia-table/components/imperia-table-filter-v2/imperia-table-filter-v2.animations';
import { ImperiaTableColumn } from '../../../imperia-table/models/imperia-table-columns.models';
import { ImperiaTableV3Component } from '../../../imperia-table-v3/components/imperia-table-v3/imperia-table-v3.component';
import {
  Filter,
  FilterOperator,
  FiltersEqual,
  FiltersValue,
  WithoutInvalidFilters,
} from '@imperiascm/scp-utils/payload';
import {
  BehaviorSubject,
  combineLatest,
  defer,
  distinctUntilChanged,
  filter,
  last,
  map,
  merge,
  Observable,
  of,
  ReplaySubject,
  share,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ImperiaTableV3FiltersHeaderCellTemplateDirective } from '../../template-directives/imperia-table-v3-filters-header-cell-template.directive';
import { ImperiaTableV3FiltersBodyCellTemplateDirective } from '../../template-directives/imperia-table-v3-filters-body-cell-template.directive';
import { IMPERIA_TABLE_V3_FILTERS_PROVIDER } from '../../providers/imperia-table-v3-filters-provider';
import { UpdateParams } from '../../models/update';
import { OnRemoveFn } from '../../models/remove';
import { normalizeString } from '@imperiascm/scp-utils/functions';

@Component({
  selector: 'imperia-table-v3-filters',
  templateUrl: './imperia-table-v3-filters.component.html',
  styleUrls: ['./imperia-table-v3-filters.component.scss'],
  animations: [
    HORIZONTAL_EXPAND_FADEIN_FADEOUT_COLLAPSE,
    VERTICAL_EXPAND_FADEIN_FADEOUT_COLLAPSE,
    HORIZONTAL_ELEMENT_ENTER_LEAVE,
    HORIZONTAL_LIST_ELEMENT_ENTER_LEAVE,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV3FiltersComponent<TItem extends object> {
  public readonly FilterOperator = FilterOperator;
  private readonly table = inject(ImperiaTableV3Component, { optional: true });

  //#region INPUTS
  public $propertiesThatAllowNullValue = input<string[]>([], {
    alias: 'propertiesThatAllowNullValue',
  });
  public propertiesThatAllowNullValue$ = toObservable(
    this.$propertiesThatAllowNullValue
  );
  //#endregion INPUTS

  //#region HEADER TEMPLATES
  @ViewChildren(ImperiaTableV3FiltersHeaderCellTemplateDirective)
  set headerCellTemplatesSetter(
    v: QueryList<ImperiaTableV3FiltersHeaderCellTemplateDirective<TItem>>
  ) {
    this.headerCellTemplates.next(v);
  }
  private headerCellTemplates = new ReplaySubject<
    QueryList<ImperiaTableV3FiltersHeaderCellTemplateDirective<TItem>>
  >(1);
  private headerCellTemplates$ = this.headerCellTemplates.pipe(
    switchMap((query) =>
      query.changes.pipe(
        map(() => query.toArray()),
        startWith(query.toArray())
      )
    )
  );

  public headerCellButtonsTemplate$ = this.headerCellTemplates$.pipe(
    map(
      (templates) =>
        templates.find(({ slot }) => slot === 'buttons')?.template ?? null
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public headerCellIconsTemplate$ = this.headerCellTemplates$.pipe(
    map(
      (templates) =>
        templates.find(({ slot }) => slot === 'icons')?.template ?? null
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion HEADER TEMPLATES

  //#region BODY TEMPLATES
  @ViewChildren(ImperiaTableV3FiltersBodyCellTemplateDirective)
  set bodyCellTemplatesSetter(
    v: QueryList<ImperiaTableV3FiltersBodyCellTemplateDirective<TItem>>
  ) {
    this.bodyCellTemplates.next(v);
  }
  private bodyCellTemplates = new ReplaySubject<
    QueryList<ImperiaTableV3FiltersBodyCellTemplateDirective<TItem>>
  >(1);
  private bodyCellTemplates$ = this.bodyCellTemplates.pipe(
    switchMap((query) =>
      query.changes.pipe(
        map(() => query.toArray()),
        startWith(query.toArray())
      )
    )
  );

  public bodyCellButtonsTemplate$ = this.bodyCellTemplates$.pipe(
    map(
      (templates) =>
        templates.find(({ slot }) => slot === 'buttons')?.template ?? null
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion BODY TEMPLATES

  //#region SHOW CONFIGURATION
  public toggleable$ = new BehaviorSubject<boolean>(true);
  @Input('toggleable') set toggleableSetter(v: boolean | null) {
    if (v === null) return;
    this.toggleable$.next(v);
  }
  //#endregion SHOW CONFIGURATION

  //#region TOGGLES
  public hideConfigurationHeader$ = new BehaviorSubject<boolean>(false);
  @Input('hideConfigurationHeader') set hideConfigurationHeaderSetter(
    v: boolean | null
  ) {
    if (v === null) return;
    this.hideConfigurationHeader$.next(v);
  }
  public readonly componentToggle = toggle({ startWith: false });
  public readonly configurationPanelToggle = toggle({ startWith: false });
  public readonly applyFiltersAutomaticallyToggle = toggle({ startWith: true });
  public readonly crossHierarchyFiltersToggle = toggle({ startWith: true });
  public readonly unselectedFiltersPanelToggle = toggle({
    startWith: false,
    falseWith: defer(() =>
      this.unselectedFilters$.pipe(filter((filters) => filters.length === 0))
    ),
  });
  @Input('opened') set openedSetter(v: boolean | null) {
    if (v === null) return;
    this.componentToggle.toggle(v);
  }
  @Output('openedChange') opened$ = this.componentToggle.value$;
  //#endregion TOGGLES

  //#region FILTER TEMPLATES
  private $filterTemplates = contentChildren(IMPERIA_TABLE_V3_FILTERS_PROVIDER);
  private filtersTemplates = toObservable(this.$filterTemplates);

  public filtersTemplates$ = this.filtersTemplates.pipe(
    map((a) => a.flatMap((b) => b.$filters())),
    switchMap((filterTemplatesDirectives) =>
      combineLatest(
        filterTemplatesDirectives.map((d) =>
          d.column$.pipe(
            map((col) => ({
              field: col?.field,
              filterTemplate: computed(
                () => d.filterTemplate()?.template ?? null
              ),
              configTemplate: computed(
                () => d.configTemplate()?.template ?? null
              ),
            }))
          )
        )
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion FILTER TEMPLATES

  //#region FILTERS
  public useFiltersInputted = input<boolean>(false);
  @Input('filters') set filtersSetter(v: ImperiaTableColumn<TItem>[] | null) {
    if (!v) return;
    this.filters.next(v);
  }
  private filters: ReplaySubject<ImperiaTableColumn<TItem>[]> =
    new ReplaySubject<ImperiaTableColumn<TItem>[]>(1);
  public filters$: Observable<ImperiaTableColumn<TItem>[]> = defer(() =>
    this.useFiltersInputted() || !this.table
      ? this.filters
      : this.table.columnsConfigured$
  ).pipe(map((columns) => columns.filter(({ allowFilter }) => allowFilter)));
  //#endregion FILTERS

  //#region ADD
  public _add = new Subject<string>();
  public add = (Column: string) => this._add.next(Column);
  private addToValue$ = this._add.pipe(
    withLatestFrom(defer(() => this.value$)),
    map(([Column, value]) => [
      ...value,
      { Column, Value: '', Operator: FilterOperator.EQUAL },
    ]),
    share()
  );
  private addToSelectedFiltersDirectives$ = this._add.pipe(
    withLatestFrom(
      this.filters$,
      defer(() => this.selectedFilters$)
    ),
    map(([Column, filters, selectedFilters]) => [
      filters.find((d) => d.filterName === Column)!,
      ...selectedFilters,
    ]),
    withLatestFrom(this.filters$),
    map(([selectedFilters, filters]) =>
      filters.filter((d) =>
        selectedFilters.some((f) => f.filterName === d.filterName)
      )
    ),
    share()
  );
  //#endregion ADD

  //#region UPDATE
  public $filterByThisValueAdapterFn = input<
    (Column: string, Value: string) => UpdateParams
  >(
    (Column, Value) => ({
      update: [
        {
          Column,
          Value,
          Operator: FilterOperator.EQUAL,
        },
      ],
      remove: [],
    }),
    { alias: 'filterByThisValueAdapterFn' }
  );
  private _update = new Subject<UpdateParams>();
  public update = ({ update, remove }: Partial<UpdateParams>) =>
    this._update.next({ update: update ?? [], remove: remove ?? [] });

  private update$ = this._update.pipe(
    withLatestFrom(
      defer(() => this.value$),
      defer(() => this.isSelectedFn)
    ),
    map(([{ update, remove }, value, isSelectedFn]) =>
      update
        .reduce<FiltersValue>(
          (acc, { Column, Operator, Value }) => {
            const indexToUpdate = acc.findIndex((f) =>
              isSelectedFn(
                {
                  Column,
                  Operator: FilterOperator.EQUAL,
                  Value: '',
                },
                f.Column
              )
            );
            const filterToUpdate = {
              ...(acc[indexToUpdate] ?? {
                Column,
                Value: '',
                Operator: FilterOperator.EQUAL,
              }),
            };

            if (Column) {
              filterToUpdate.Column = Column;
            }

            if (Operator) {
              filterToUpdate.Operator = Operator;
            }

            if (Value !== undefined) {
              filterToUpdate.Value = Value;
            }

            const filterIndex = indexToUpdate < 0 ? acc.length : indexToUpdate;

            acc[filterIndex] = filterToUpdate;

            return acc;
          },
          [...value]
        )
        .filter(
          (filterUpdate, i) =>
            !remove.find(({ Column }) =>
              isSelectedFn(
                {
                  Column,
                  Operator: FilterOperator.EQUAL,
                  Value: '',
                },
                filterUpdate.Column
              )
            )
        )
    ),
    share()
  );
  //#endregion UPDATE

  //#region REMOVE
  @Input('onRemoveFn') set onRemoveFnSetter(v: OnRemoveFn<TItem> | null) {
    if (!v) return;
    this.onRemoveFn.next(v);
  }
  private onRemoveFn = new BehaviorSubject<OnRemoveFn<TItem>>(() => {});

  private _remove = new Subject<string>();
  public remove = (Column: string) => this._remove.next(Column);
  private removeFromValue$ = this._remove.pipe(
    withLatestFrom(
      defer(() => this.value$),
      defer(() => this.isSelectedFn)
    ),
    map(([Column, value, isSelectedFn]) =>
      value.filter((f) => !isSelectedFn(f, Column))
    ),
    share()
  );
  private removeFromSelectedFiltersDirectives$ = this._remove.pipe(
    withLatestFrom(defer(() => this.selectedFilters$)),
    map(([Column, selectedFilters]) => ({
      removed: Column,
      selectedFilters: selectedFilters.filter((d) => d.filterName !== Column),
    })),
    withLatestFrom(this.onRemoveFn),
    tap(([{ removed, selectedFilters }, onRemoveFn]) =>
      onRemoveFn(removed, this.update, selectedFilters)
    ),
    map(([{ selectedFilters }]) => selectedFilters),
    share()
  );
  //#endregion REMOVE

  //#region REMOVE ALL
  private _removeAll = new Subject<void>();
  public removeAll = () => this._removeAll.next();
  private removeAllFromValue$ = this._removeAll.pipe(map(() => []));
  private removeAllFromSelectedFiltersDirectives$ = this._removeAll.pipe(
    map(() => [])
  );
  //#endregion REMOVE ALL

  //#region APPLY
  public apply = () => this._apply.next();
  private _apply = new Subject<void>();
  private apply$ = this._apply.pipe(switchMap(() => this.value$.pipe(take(1))));

  public thereAreChangesToBeApplied$ = combineLatest({
    currentValue: defer(() => this.value$).pipe(
      map(WithoutInvalidFilters),
      distinctUntilChanged(FiltersEqual)
    ),
    lastApplied: merge(
      defer(() => this.value$).pipe(take(1)),
      this.apply$
    ).pipe(map(WithoutInvalidFilters), distinctUntilChanged(FiltersEqual)),
  }).pipe(
    map(
      ({ currentValue, lastApplied }) =>
        !FiltersEqual(currentValue, lastApplied)
    ),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion APPLY

  //#region VALUE
  @Input('value')
  public set valueSetter(v: FiltersValue | null) {
    this._value.next(v ?? []);
  }
  private _value = new ReplaySubject<FiltersValue>(1);
  private _valueChange = this._value.pipe(distinctUntilChanged(FiltersEqual));
  public value$: Observable<FiltersValue> = merge(
    this._valueChange,
    this.addToValue$,
    this.update$,
    this.removeFromValue$,
    this.removeAllFromValue$,
    combineLatest([
      this.filters$.pipe(last()),
      defer(() => this.isSelectedFn),
    ]).pipe(
      switchMap(([filters, isSelectedFn]) =>
        this.value$.pipe(
          take(1),
          map((value) => ({ filters, isSelectedFn, value }))
        )
      ),
      map(({ filters, isSelectedFn, value }) =>
        value.filter((f) => filters.some((d) => isSelectedFn(f, d.filterName)))
      )
    )
  ).pipe(
    distinctUntilChanged(FiltersEqual),
    tap(
      (filters) =>
        !!filters.length &&
        setTimeout(() => {
          this.componentToggle.toggle(true);
        })
    ),
    withValueFrom(this.propertiesThatAllowNullValue$),
    map(([filters, propertiesThatAllowNullValue]) =>
      this.parseFiltersValueToString(filters, propertiesThatAllowNullValue)
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public valueMap$: Observable<Map<string, Filter>> = this.value$.pipe(
    map((value) => new Map(value.map((filter) => [filter.Column, filter]))),
    startWith(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public hierarchyFiltersInValue$ =
    this.crossHierarchyFiltersToggle.value$.pipe(
      switchMap((crossHierarchyFilters) =>
        crossHierarchyFilters
          ? this.value$.pipe(
              map((value) =>
                value.filter(({ Column }) => isHierarchyKey(Column))
              ),
              map((hierarchyFiltersInValue) =>
                hierarchyFiltersInValue.filter(
                  ({ Value }) => typeof Value === 'string' && Value.length > 0
                )
              )
            )
          : of([])
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  @Output('valueChange') public valueChange$ = merge(
    this.value$.pipe(this.ifApplyFiltersAutomaticallyIs(true)),
    this.apply$
  ).pipe(share());
  //#endregion VALUE

  //#region SELECTED FILTERS DIRECTIVES
  @Input('isSelectedFn') set isSelectedFnSetter(
    v: ((filter: Filter, ColumnFilterName: string) => boolean) | null
  ) {
    if (!v) return;
    this.isSelectedFn.next(v);
  }
  public isSelectedFn = new BehaviorSubject<
    (filter: Filter, ColumnFilterName: string) => boolean
  >((filter, filterName) => filter.Column === filterName);

  @Input('onRemoveSuccesFn') set onRemoveSuccesFnFnSetter(
    v:
      | ((
          columnToRemove: string,
          updateSubject: Subject<{
            toUpdate: {
              filterName: string;
              filter: {
                Column?: string;
                Value?: string;
                Operator?: FilterOperator;
              };
            }[];
            toRemove: {
              filterName: string;
              filter: {
                Column?: string;
                Value?: string;
                Operator?: FilterOperator;
              };
            }[];
          }>,
          filtersValue: FiltersValue
        ) => void)
      | null
  ) {
    if (!v) return;
    this.onRemoveSuccesFn.next(v);
  }
  private onRemoveSuccesFn = new BehaviorSubject<
    (
      columnToRemove: string,
      updateSubject: Subject<{
        toUpdate: {
          filterName: string;
          filter: {
            Column?: string;
            Value?: string;
            Operator?: FilterOperator;
          };
        }[];
        toRemove: {
          filterName: string;
          filter: {
            Column?: string;
            Value?: string;
            Operator?: FilterOperator;
          };
        }[];
      }>,
      filtersValue: FiltersValue
    ) => void
  >((columnToRemove) => void 0);

  public selectedFilters$: Observable<ImperiaTableColumn<TItem>[]> = merge(
    this.value$.pipe(
      switchMap((value) =>
        this.filters$.pipe(
          withValueFrom(this.isSelectedFn),
          map(([filters, isSelectedFn]) =>
            filters.filter((d) =>
              value.some((f) => isSelectedFn(f, d.filterName))
            )
          )
        )
      )
    ),
    this.addToSelectedFiltersDirectives$,
    this.removeFromSelectedFiltersDirectives$,
    this.removeAllFromSelectedFiltersDirectives$
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion SELECTED FILTERS DIRECTIVES

  //#region UNSELECTED FILTERS SEARCH
  public unselectedFiltersSearch = new Subject<string>();
  public unselectedFiltersSearch$ = this.unselectedFiltersSearch.pipe(
    startWith(''),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion UNSELECTED FILTERS SEARCH

  //#region UNSELECTED FILTERS
  public unselectedFilters$ = combineLatest([
    this.filters$,
    this.selectedFilters$,
  ]).pipe(
    map(([filters, selectedFilters]) =>
      filters.filter(
        (filter) =>
          !selectedFilters.some(
            (selectedFilter) => filter.filterName === selectedFilter.filterName
          )
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public unselectedFiltersSearched$ = combineLatest([
    this.unselectedFilters$,
    this.unselectedFiltersSearch$,
  ]).pipe(
    map(([filters, search]) =>
      filters.filter(({ header }) =>
        normalizeString(header.toLowerCase()).includes(
          normalizeString(search.toLowerCase())
        )
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion UNSELECTED FILTERS

  public addFilter = new Subject<Filter | string>();

  public toggle(value?: boolean) {
    this.componentToggle.toggle(value);
  }

  public onPaste(event: ClipboardEvent, column: ImperiaTableColumn<TItem>) {
    event.preventDefault();
    const { clipboardData } = event;
    if (!clipboardData) return;
    const text = clipboardData.getData('text');
    if (!text) return;
    const textWithCommas = text.split(/[\r\n]+/g).join(';');
    this.update({
      update: [{ Column: column.filterName, Value: textWithCommas }],
      remove: [],
    });
  }

  private ifApplyFiltersAutomaticallyIs(is: boolean) {
    return <T>(source: Observable<T>) =>
      source.pipe(
        withLatestFrom(this.applyFiltersAutomaticallyToggle.value$),
        filter(
          ([_, applyFiltersAutomatically]) => applyFiltersAutomatically === is
        ),
        map(([value]) => value)
      );
  }

  private parseFiltersValueToString(
    filters: FiltersValue,
    propertiesThatAllowNullValue: string[]
  ) {
    return filters.map((filter) => ({
      ...filter,
      Value:
        filter.Value === null &&
        propertiesThatAllowNullValue.includes(filter.Column)
          ? filter.Value
          : filter.Value !== null && filter.Value !== undefined
          ? filter.Value + ''
          : '',
    }));
  }
}
