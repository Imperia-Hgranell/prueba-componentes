import {
  ContentChild,
  ContentChildren,
  Directive,
  Input,
  Optional,
  QueryList,
  signal,
  SkipSelf,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  combineLatest,
  map,
  merge,
  Observable,
  ReplaySubject,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs';
import { IMPERIA_TABLE_V3_COLUMN_GROUPS_PROVIDER } from '../imperia-table-v3-columns-provider';
import { ImpColumnsGroupTemplateDirective } from '../../imperia-table/directives/imp-columns-group-template.directive';
import { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';
import { ImperiaTableV2ColumnDirective } from '../../imperia-table/directives/imperia-table-v2-column.directive';
import { TImperiaTableColumnStyle } from '../../imperia-table/models/imperia-table-columns.types';
import { RandomBetween } from '@imperiascm/scp-utils/functions';

@Directive({
  selector: 'imperia-table-v3-columns-group',
  exportAs: 'imperiaTableV3ColumnsGroup',
  providers: [
    {
      provide: IMPERIA_TABLE_V3_COLUMN_GROUPS_PROVIDER,
      useExisting: ImperiaTableV3ColumnsGroupDirective,
    },
  ],
  standalone: false,
})
export class ImperiaTableV3ColumnsGroupDirective<TItem extends object> {
  private _level = 0;
  get level() {
    return this._level;
  }

  private _key!: string;
  get key() {
    return this._key;
  }

  //#region CONTENT CHILDREN
  @ContentChildren(ImperiaTableV2ColumnDirective, { descendants: true })
  set columnsDirectivesSetter(
    v: QueryList<ImperiaTableV2ColumnDirective<TItem>> | null
  ) {
    if (!v) return;
    this.columnsDirectives.next(v);
  }
  public columnsDirectives = new ReplaySubject<
    QueryList<ImperiaTableV2ColumnDirective<TItem>>
  >(1);

  @ContentChildren(ImperiaTableV3ColumnsGroupDirective, { descendants: true })
  set columnsGroupsDirectivesSetter(
    v: QueryList<ImperiaTableV3ColumnsGroupDirective<TItem>> | null
  ) {
    if (!v) return;
    this.columnsGroupsDirectives.next(v);
  }
  public columnsGroupsDirectives = new ReplaySubject<
    QueryList<ImperiaTableV3ColumnsGroupDirective<TItem>>
  >(1);

  public columnToAdd = new ReplaySubject<ImperiaTableColumn<TItem>[]>();
  public columns$: Observable<ImperiaTableColumn<TItem>[]> = merge(
    combineLatest([
      this.columnsDirectives.pipe(
        switchMap((queryList) =>
          queryList.changes.pipe(
            map(() => queryList.toArray()),
            startWith(queryList.toArray())
          )
        ),
        switchMap((cols) =>
          combineLatest(cols.map(({ column$ }) => column$)).pipe(take(1))
        ),
        startWith([])
      ),
      this.columnsGroupsDirectives.pipe(
        switchMap((queryList) =>
          queryList.changes.pipe(
            map(() => queryList.toArray()),
            startWith(queryList.toArray())
          )
        ),
        switchMap((groups) =>
          combineLatest(groups.map(({ columns$ }) => columns$))
            .pipe(
              take(1),
              startWith([]),
              map((cols) => cols.flat())
            )
            .pipe(take(1))
        )
      ),
    ]).pipe(
      map(([cols, childGroupsCols]) => [
        ...cols.filter(
          ({ field }) => !childGroupsCols.find((col) => col.field === field)
        ),
        ...childGroupsCols,
      ]),
      startWith([])
    ),
    this.columnToAdd.pipe(
      switchMap((colsToAdd) =>
        this.columns$.pipe(
          take(1),
          map((cols) => [...cols, ...colsToAdd])
        )
      )
    )
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  public $columns = toSignal(this.columns$);

  @ContentChild(ImpColumnsGroupTemplateDirective, { descendants: true })
  set columnGroupTemplateDirectiveSetter(
    v: ImpColumnsGroupTemplateDirective<TItem> | null
  ) {
    if (!v) return;
    this.columnGroupTemplateDirective.next(v);
  }
  public columnGroupTemplateDirective = new ReplaySubject<
    ImpColumnsGroupTemplateDirective<TItem>
  >(1);
  //#endregion CONTENT CHILDREN

  //#region PROPERTIES
  public keySetter(key: string) {
    this._key = key + RandomBetween(0, 1000);
  }

  @Input('key') public set keyInputSetter(v: string | null) {
    if (!v) return;
    this.keySetter(v);
  }

  public header = new ReplaySubject<string>(1);
  @Input('header') public set headerSetter(v: string | null) {
    if (!v) return;
    this._key = v + RandomBetween(0, 1000);
    this.header.next(v);
  }

  public headerCellClass = signal<string | null>(null);
  @Input('headerCellClass') public set headerCellClassSetter(v: string | null) {
    if (!v) return;
    this.headerCellClass.set(v);
  }

  public headerCellStyle = signal<TImperiaTableColumnStyle | null>(null);
  @Input('headerCellStyle') public set headerCellStyleSetter(
    v: TImperiaTableColumnStyle | null
  ) {
    if (!v) return;
    this.headerCellStyle.set(v);
  }

  public headerTextStyle = signal<TImperiaTableColumnStyle | null>(null);
  @Input('headerTextStyle') public set headerTextStyleSetter(
    v: TImperiaTableColumnStyle | null
  ) {
    if (!v) return;
    this.headerTextStyle.set(v);
  }

  public width$: Observable<number> = this.columns$
    .pipe(
      map((cols) =>
        cols
          .filter(({ visible }) => visible)
          .map((col) => col.width$.pipe(map(() => col.width)))
      )
    )
    .pipe(
      switchMap((widths$) => combineLatest(widths$)),
      map((widths) =>
        widths.reduce<number>(
          (totalWidth, width) =>
            totalWidth + (typeof width === 'number' ? width : 0),
          0
        )
      ),
      startWith(0),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  public frozen$ = this.columns$.pipe(
    map((columns) => columns.some((col) => col.frozen)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public frozenPosition$ = this.columns$.pipe(
    map((columns) => columns[0]?.frozenPosition ?? 'left'),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion PROPERTIES

  constructor(
    @Optional()
    @SkipSelf()
    public parentGroup: ImperiaTableV3ColumnsGroupDirective<TItem> | null
  ) {
    const stack = [parentGroup];
    while (stack.length) {
      const current = stack.pop();
      if (current) {
        this._level++;
        stack.push(current.parentGroup);
      }
    }
  }

  public addColumn(columns: ImperiaTableColumn<TItem>[]) {
    this.columnToAdd.next(columns);
  }
}
