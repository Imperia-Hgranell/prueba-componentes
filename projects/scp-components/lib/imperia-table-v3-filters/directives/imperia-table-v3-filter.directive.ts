import {
  computed,
  contentChildren,
  Directive,
  Host,
  Input,
  Optional,
  Signal,
  signal,
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  defer,
  map,
  Observable,
  of,
  shareReplay,
  tap,
} from 'rxjs';
import { IMPERIA_TABLE_V3_FILTERS_PROVIDER } from '../providers/imperia-table-v3-filters-provider';
import { ImperiaTableV3FilterTemplateContextDirective } from './imperia-table-v3-filter-template-context.directive';
import { ImperiaTableV3FiltersComponent } from '../components/imperia-table-v3-filters/imperia-table-v3-filters.component';
import { ImperiaTableV3Component } from '../../imperia-table-v3/components/imperia-table-v3/imperia-table-v3.component';

export interface ImperiaTableV3FiltersProvider<TItem extends object> {
  $filters: Signal<ImperiaTableV3FilterDirective<TItem>[]>;
}

@Directive({
  selector: 'imperia-table-v3-filter',
  providers: [
    {
      provide: IMPERIA_TABLE_V3_FILTERS_PROVIDER,
      useExisting: ImperiaTableV3FilterDirective,
    },
  ],
  standalone: false,
})
export class ImperiaTableV3FilterDirective<TItem extends object>
  implements ImperiaTableV3FiltersProvider<TItem>
{
  @Input('key') set keySetter(v: string | null) {
    this._key.next(v);
  }
  private _key = new BehaviorSubject<string | null>(null);
  public get key$(): Observable<string | null> {
    return this._key;
  }
  public get key(): string | null {
    return this._key.value;
  }

  public $filters = signal([this]);

  @Input('forColumn') set forColumnSetter(v: string | null) {
    this._forColumn.next(v);
  }
  private _forColumn = new BehaviorSubject<string | null>(null);
  public get forColumn$(): Observable<string | null> {
    return this._forColumn;
  }
  public get forColumn(): string | null {
    return this._forColumn.value;
  }

  private templates = contentChildren(
    ImperiaTableV3FilterTemplateContextDirective<TItem>
  );

  public filterTemplate = computed(() =>
    this.templates().find((t) => t.type() === 'filter')
  );
  public configTemplate = computed(() =>
    this.templates().find((t) => t.type() === 'config')
  );

  public column$ = combineLatest([
    this._forColumn,
    this._key,
    defer(() => this.table?.columnsConfigured$ ?? of([])),
  ]).pipe(
    map(
      ([forColumn, key, columns]) =>
        columns.find(
          ({ field, filterName }) =>
            [forColumn, key].includes(field) ||
            [forColumn, key].includes(filterName)
        ) ?? null
    ),
    tap((column) => column && (column.allowFilter = true)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public value$ = combineLatest([
    this._forColumn,
    this._key,
    !!this.filters ? this.filters.value$ : of([]),
  ]).pipe(
    map(
      ([forColumn, key, filters]) =>
        filters.find(({ Column }) => [forColumn, key].includes(Column))
          ?.Value ?? null
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(
    @Optional() public table: ImperiaTableV3Component<any> | null,
    @Optional()
    @Host()
    public filters: ImperiaTableV3FiltersComponent<any> | null
  ) {}
}
