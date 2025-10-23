import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  input,
  Input,
  Optional,
  Output,
  QueryList,
} from '@angular/core';
import { ImperiaTableV2Component } from '../imperia-table-v2/imperia-table-v2.component';
import { ImperiaTableComponent } from '../imperia-table/imperia-table.component';
import { ImperiaTableColumn } from '../../models/imperia-table-columns.models';
import { ImperiaTableLoading } from '../../models/imperia-table-loading.models';
import { ImperiaTableCellSaveEvent } from '../../models/imperia-table-outputs.models';
import { ROWS_CONFIGURATOR_TABLE_COLUMNS } from '../../models/imperia-table-v2-rows-configurator.constants';
import { RowsConfiguration, RowsConfiguratorMoveEvent } from '../../models/imperia-table-v2-rows-configurator.models';
import { getImperiaTableColumns } from '../../shared/functions';
import { ImperiaTableBodyCellTemplateDirective } from '../../template-directives/imperia-table-body-cell-template.directive';
import { ImpTranslateService } from '@imperiascm/translate';
import {
  BehaviorSubject,
  defer,
  map,
  merge,
  mergeWith,
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

export type RowsConfiguratorItem = {
  Key: string;
  Label: string;
  [key: string]: any;
};

@Component({
  selector: 'imperia-table-v2-rows-configurator',
  templateUrl: './imperia-table-v2-rows-configurator.component.html',
  styleUrls: ['./imperia-table-v2-rows-configurator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV2RowsConfiguratorComponent<
  TItem extends object & Partial<RowsConfiguratorItem>
> {
  //#region TEXT
  @Input('title') title: string =
    this.typedTranslateService.translation.IMPERIA_TABLE.rows_configurator
      .title;
  @Input('resetLabel') resetLabel: string =
    this.typedTranslateService.translation.IMPERIA_TABLE.rows_configurator
      .buttons.reset;
  @Input('showAllLabel') showAllLabel: string =
    this.typedTranslateService.translation.IMPERIA_TABLE.rows_configurator
      .buttons.showAll;
  @Input('hideAllLabel') hideAllLabel: string =
    this.typedTranslateService.translation.IMPERIA_TABLE.rows_configurator
      .buttons.hideAll;
  //#endregion TEXT

  //#region STORAGE KEY
  private storageKey$ = defer(() => {
    if (this.imperiaTableV2) {
      return this.imperiaTableV2.storageKey;
    } else if (this.imperiaTableV1) {
      return of(this.imperiaTableV1.storageKey);
    } else {
      return of(null);
    }
  }).pipe(
    map((tableStorageKey) => tableStorageKey || this.storageKey),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion STORAGE KEY

  //#region ACCEPT
  public onAcceptModalRowsToConfigure: Subject<void> = new Subject<void>();
  public onAcceptModalRowsToConfigure$: Observable<RowsConfiguration<TItem>[]> =
    this.onAcceptModalRowsToConfigure
      .pipe(
        switchMap(() =>
          this.rowsToConfigure$.pipe(
            take(1),
            map((rows) =>
              rows.map(
                (row) => new RowsConfiguration(row.Key, row.Item, row.Visible)
              )
            ),
            withLatestFrom(this.storageKey$),
            tap(([rows, storageKey]) =>
              this.setRowsConfigurationToStorage(storageKey, rows)
            ),
            tap(() => this.toggleModalVisibility.next(false)),
            map(([rows]) => rows)
          )
        )
      )
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion ACCEPT

  //#region INPUTS
  public $allowEdit = input<boolean>(false, { alias: 'allowEdit' });
  @Input('storageKey') storageKey: string = '';
  /**
   * @description Make sure that the keyValue you introduce here is the same as the key you used to instance the rowConfiguration
   */
  @Input('keyValue') keyValue!: keyof TItem & string;
  public disabledButton: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  @Input('disabled') set disabledButtonSetter(v: boolean | null) {
    if (v === null) return;
    this.disabledButton.next(v);
  }
  public imperiaTableRows: ReplaySubject<RowsConfiguration<TItem>[]> =
    new ReplaySubject<RowsConfiguration<TItem>[]>(1);
  @Input('imperiaTableRows') set imperiaTableRowsSetter(
    v: RowsConfiguration<TItem>[] | null
  ) {
    if (!v) return;
    this.imperiaTableRows.next(v);
  }
  public imperiaTableRows$: Observable<RowsConfiguration<TItem>[]> =
    this.imperiaTableRows.pipe(
      map((rows) =>
        rows.map(
          (item) =>
            new RowsConfiguration(this.keyValue, item.Item, item.Visible)
        )
      ),
      mergeWith(this.onAcceptModalRowsToConfigure$),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  public onCellSave: Subject<
    ImperiaTableCellSaveEvent<
      RowsConfiguration<TItem>,
      keyof RowsConfiguration<TItem>
    >
  > = new Subject<
    ImperiaTableCellSaveEvent<
      RowsConfiguration<TItem>,
      keyof RowsConfiguration<TItem>
    >
  >();
  public onCellSave$ = this.onCellSave.pipe(
    withLatestFrom(defer(() => this.rowsToConfigure$)),
    tap(([event]) => event.setDataSyncState('update', 'saved')),
    map(([event, rows]) =>
      rows.map((row) => {
        console.log({ item: row.Item, newItem: event.newItem });
        if (row.keyValue === event.newItem.Item['value']) {
          return {
            ...row,
            Item: { ...row.Item, Label: event.newValue } as TItem,
          } as RowsConfiguration<TItem>;
        } else {
          return row;
        }
      })
    )
  );

  private defaultImperiaTableRows = new ReplaySubject<
    RowsConfiguration<TItem>[]
  >(1);
  @Input('imperiaTableDefaultRows') set imperiaTableDefaultRowsSetter(
    v: RowsConfiguration<TItem>[] | null
  ) {
    if (!v) return;
    this.defaultImperiaTableRows.next(v);
  }
  private defaultImperiaTableRows$: Observable<RowsConfiguration<TItem>[]> =
    this.defaultImperiaTableRows;
  //#endregion INPUTS

  //#region BODY CELL TEMPLATES
  @ContentChildren(ImperiaTableBodyCellTemplateDirective<TItem>)
  set bodyCellTemplatesSetter(
    v: QueryList<ImperiaTableBodyCellTemplateDirective<TItem>>
  ) {
    this.bodyCellTemplates = v.toArray();
  }
  public bodyCellTemplates: ImperiaTableBodyCellTemplateDirective<TItem>[] = [];
  //#endregion BODY CELL TEMPLATES

  //#region MODAL VISIBILITY
  public toggleModalVisibility = new Subject<boolean>();
  public modalVisible$: Observable<boolean> = this.toggleModalVisibility.pipe(
    map((visible) => visible),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion MODAL VISIBILITY

  //#region COLUMNS
  public readonly COLUMNS: ImperiaTableColumn<any>[] = getImperiaTableColumns(
    ROWS_CONFIGURATOR_TABLE_COLUMNS,
    this.typedTranslateService.translation.IMPERIA_TABLE.columns_configurator
      .columns
  );
  //#endregion COLUMNS

  //#region SELECTION
  public selection = new BehaviorSubject<RowsConfiguration<TItem>[]>([]);
  public isSomeRowSelected$: Observable<boolean> = this.selection.pipe(
    map((rows) => !!rows.length)
  );
  //#endregion SELECTION

  //#region MOVE
  public move = new Subject<RowsConfiguratorMoveEvent<TItem>>();
  public onMove$: Observable<RowsConfiguration<TItem>[]> = this.move.pipe(
    withLatestFrom(this.selection),
    map(([{ direction, rows }, [rowsSelected]]) => {
      const indexOfRowToMove = rows.findIndex(
        (row) => row.Item[this.keyValue] === rowsSelected.Item[this.keyValue]
      );

      return direction === 'up' && indexOfRowToMove > 0
        ? [...this.swapRows(rows, indexOfRowToMove, indexOfRowToMove - 1)]
        : direction === 'down' && indexOfRowToMove < rows.length - 1
        ? [...this.swapRows(rows, indexOfRowToMove, indexOfRowToMove + 1)]
        : rows;
    }),
    share()
  );
  //#endregion MOVE

  //#region VISIBILITY
  public toggleVisibility = new Subject<{
    rows: RowsConfiguration<TItem>[];
    rowSelected: RowsConfiguration<TItem>;
  }>();
  public onToggleVisibility$ = this.toggleVisibility.pipe(
    map(({ rows, rowSelected }) => {
      const row = rows.find(
        (row) => row.Item[this.keyValue] === rowSelected.Item[this.keyValue]
      );
      if (row) row.Visible = !row.Visible;
      return rows;
    }),
    share()
  );

  public showAllRows = new Subject<void>();
  public showAllRows$ = this.showAllRows.pipe(
    switchMap(() => this.rowsToConfigure$.pipe(take(1))),
    map((rows) =>
      rows.map((r) => {
        r.visible = true;
        return r;
      })
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public hideAllRows = new Subject<void>();
  public hideAllRows$ = this.hideAllRows.pipe(
    switchMap(() => this.rowsToConfigure$.pipe(take(1))),
    map((rows) =>
      rows.map((r) => {
        r.visible = false;
        return r;
      })
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion VISIBILITY

  //#region RESET
  public reset = new Subject<void>();
  private onReset$ = this.reset.pipe(
    switchMap(() =>
      this.defaultImperiaTableRows$.pipe(
        take(1),
        map((rowsConfig) => rowsConfig.map((row) => row.withDefaultConfig()))
      )
    )
  );
  //#endregion RESET

  //#region ON CLOSE
  private close = new Subject<void>();
  private close$: Observable<RowsConfiguration<TItem>[]> = this.close
    .pipe(
      switchMap(() =>
        this.imperiaTableRows$.pipe(
          map((rows) => rows.map((row) => row.withDefaultConfig()))
        )
      )
    )
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion ON CLOSE

  //#region COLUMNS TO CONFIGURE
  public rowsToConfigure$: Observable<RowsConfiguration<TItem>[]> = merge(
    this.imperiaTableRows$,
    merge(
      this.onCellSave$,
      this.showAllRows$,
      this.hideAllRows$,
      this.onMove$,
      this.onToggleVisibility$,
      this.onReset$,
      this.close$
    ).pipe(map((rows) => rows))
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  @Output('onRowsConfigurationChange') onRowsConfigurationChange =
    this.onAcceptModalRowsToConfigure$;
  //#endregion COLUMNS TO CONFIGURE

  //#region LOADING
  public loading$ = merge(
    this.rowsToConfigure$.pipe(map(() => new ImperiaTableLoading(false))),
    this.onAcceptModalRowsToConfigure$.pipe(
      map(() => new ImperiaTableLoading(false))
    )
  );
  //#endregion LOADING

  //#region ACCEPT BUTTON
  public acceptButtonDisabled$: Observable<boolean> = merge(
    this.onCellSave$.pipe(map(() => false)),
    this.onMove$.pipe(map(() => false)),
    this.showAllRows$.pipe(map(() => false)),
    this.hideAllRows$.pipe(map(() => false)),
    this.onToggleVisibility$.pipe(map(() => false)),
    this.onReset$.pipe(map(() => false)),
    this.onAcceptModalRowsToConfigure$.pipe(map(() => true)),
    this.close$.pipe(map(() => true)),
    this.rowsToConfigure$.pipe(map((rows) => rows.every((row) => !row.Visible)))
  ).pipe(startWith(true));
  //#endregion ACCEPT BUTTON

  constructor(
    private typedTranslateService: ImpTranslateService,
    @Optional() private imperiaTableV2: ImperiaTableV2Component<TItem> | null,
    @Optional() private imperiaTableV1: ImperiaTableComponent<TItem> | null
  ) {}

  private swapRows(
    rows: RowsConfiguration<TItem>[],
    indexA: number,
    indexB: number
  ): RowsConfiguration<TItem>[] {
    const rowA = rows[indexA];
    rows[indexA] = rows[indexB];
    rows[indexB] = rowA;
    return rows;
  }

  public onCloseRowsConfigurator() {
    this.close.next();
    this.selection.next([]);
    this.toggleModalVisibility.next(false);
  }

  public setRowsConfigurationToStorage(
    key: string | undefined,
    rows: RowsConfiguration<TItem>[]
  ): void {
    if (!key) return;
    localStorage.setItem(key + '_rowsConfiguration', JSON.stringify(rows));
  }
}
