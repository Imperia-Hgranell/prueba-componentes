import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Host,
  Inject,
  Output,
  forwardRef,
} from '@angular/core';
import { ImperiaTableColumn } from '../../models/imperia-table-columns.models';
import { ImperiaTableLoading } from '../../models/imperia-table-loading.models';
import { COLUMNS_CONFIGURATOR_TABLE_COLUMNS } from '../../models/imperia-table-v2-columns-configurator.constants';
import { ColumnConfiguration, ColumnsConfiguratorMoveEvent, ColumnsConfiguratorMoveEventDirection } from '../../models/imperia-table-v2-columns-configurator.models';
import { getImperiaTableColumns } from '../../shared/functions';
import {
  IMPERIA_TABLE_V2_COLUMNS_CONFIGURATOR,
  IMPERIA_TABLE_V2_HOST,
} from '../../../shared/template-apis/imperia-table.tokens';
import type { ImperiaTableV2Host } from '../../../shared/template-apis/imperia-table.tokens';
import { ImpTranslateService } from '@imperiascm/translate';
import {
  BehaviorSubject,
  Observable,
  Subject,
  filter,
  map,
  merge,
  share,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';

@Component({
  selector: 'imperia-table-v2-columns-configurator',
  templateUrl: './imperia-table-v2-columns-configurator.component.html',
  styleUrls: ['./imperia-table-v2-columns-configurator.component.scss'],
  providers: [
    {
      provide: IMPERIA_TABLE_V2_COLUMNS_CONFIGURATOR,
      useExisting: forwardRef(() => ImperiaTableV2ColumnsConfiguratorComponent),
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV2ColumnsConfiguratorComponent<TItem extends object> {
  //#region MODAL VISIBILITY
  public toggleModalVisibility = new Subject<void>();
  public modalVisible$: Observable<boolean> = this.toggleModalVisibility.pipe(
    switchMap(() =>
      this.modalVisible$.pipe(
        take(1),
        map((visible) => !visible)
      )
    ),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion MODAL VISIBILITY

  //#region COLUMNS
  public readonly COLUMNS: ImperiaTableColumn<any>[] = getImperiaTableColumns(
    COLUMNS_CONFIGURATOR_TABLE_COLUMNS,
    this.translate.translation.IMPERIA_TABLE.columns_configurator.columns
  );
  //#endregion COLUMNS

  //#region SELECTION
  public selection = new BehaviorSubject<ImperiaTableColumn<TItem>[]>([]);
  public isSomeColumnSelected$: Observable<boolean> = this.selection.pipe(
    filter((columns) => columns.length > 0),
    map((columns) => columns[0].configurable)
  );
  //#endregion SELECTION

  //#region MOVE
  public move = new Subject<ColumnsConfiguratorMoveEvent<TItem>>();
  public onMove$: Observable<ImperiaTableColumn<TItem>[]> = this.move.pipe(
    withLatestFrom(this.selection),
    map(([{ direction, columns }, [columnSelected]]) => {
      const indexOfColumnToMove = columns
        .filter((col) => col.configurable)
        .findIndex((col) => col.field === columnSelected.field);
      if (
        !this.canBeMoved(
          columns.filter((col) => col.configurable),
          columnSelected,
          indexOfColumnToMove,
          direction
        )
      ) {
        return columns;
      }

      return direction === 'up' && indexOfColumnToMove > 0
        ? [
            ...columns.filter((col) => !col.configurable),
            ...this.swapColumns(
              columns.filter((col) => col.configurable),
              indexOfColumnToMove,
              indexOfColumnToMove - 1
            ),
          ]
        : direction === 'down' && indexOfColumnToMove < columns.length - 1
        ? [
            ...columns.filter((col) => !col.configurable),
            ...this.swapColumns(
              columns.filter((col) => col.configurable),
              indexOfColumnToMove,
              indexOfColumnToMove + 1
            ),
          ]
        : columns;
    }),
    share()
  );
  //#endregion MOVE

  //#region VISIBILITY
  public toggleVisibility = new Subject<{
    columns: ImperiaTableColumn<TItem>[];
    columnSelected: ImperiaTableColumn<TItem>;
  }>();
  public onToggleVisibility$ = this.toggleVisibility.pipe(
    map(({ columns, columnSelected }) => {
      const column = columns.find((col) => col.field === columnSelected.field);
      if (column) column.configuration.visible = !column.configuration.visible;
      return columns;
    }),
    share()
  );
  //#endregion VISIBILITY

  //#region FROZEN
  public toggleFrozen = new Subject<{
    columnsToConfigure: ImperiaTableColumn<TItem>[];
    columnSelected: ImperiaTableColumn<TItem>;
    frozenPosition?: 'left' | 'right';
  }>();
  public onToggleFrozen$ = this.toggleFrozen.pipe(
    withLatestFrom(this.imperiaTable.columns$),
    map(([{ columnsToConfigure, columnSelected, frozenPosition }, columns]) => {
      const indexOfColumnToMove = columnsToConfigure.findIndex(
        (col) => col.field === columnSelected.field
      );
      const columnMoved = columnsToConfigure.splice(indexOfColumnToMove, 1)[0];
      const previousIndexOfColumnToMove =
        frozenPosition === 'left'
          ? this.getIndexOfFrozenColumn(columnsToConfigure, 'last', 'left')
          : frozenPosition === 'right'
          ? this.getIndexOfFrozenColumn(columnsToConfigure, 'last', 'right')
          : this.getIndexOfColumnInOriginalColumns(
              columns as any /* PARA EVITAR ERRORES RANDOM DE TYPESCRIPT */,
              columnsToConfigure,
              columnSelected
            );
      if (previousIndexOfColumnToMove !== undefined) {
        columnsToConfigure.splice(
          previousIndexOfColumnToMove + 1,
          0,
          columnMoved
        );
      } else {
        columnsToConfigure.unshift(columnMoved);
      }

      columnMoved.configuration.frozen = !columnMoved.configuration.frozen;
      frozenPosition === 'right'
        ? (columnMoved.configuration.frozenPosition = 'right')
        : (columnMoved.configuration.frozenPosition = 'left');

      return columnsToConfigure;
    }),
    share()
  );
  //#endregion FROZEN

  //#region RESET
  public reset = new Subject<void>();
  private onReset$ = this.reset.pipe(
    switchMap(() => this.imperiaTable.columns$),
    tap((columns) =>
      columns.forEach((col) => {
        if (col.configurable) {
          col.configuration.visible = col.visible;
          col.configuration.frozen = col.frozen;
        }
      })
    )
  );
  //#endregion RESET

  //#region COLUMNS TO CONFIGURE
  public columnsToConfigure$: Observable<ImperiaTableColumn<TItem>[]> = merge(
    this.imperiaTable.columnsConfigured$,
    merge(
      this.onMove$,
      this.onToggleVisibility$,
      this.onToggleFrozen$,
      this.onReset$
    ).pipe(
      withLatestFrom(this.imperiaTable.storageKey),
      tap(([columns, storageKey]) => {
        this.setColumnsConfigurationToStorage(storageKey, columns);
      }),
      map(([columns]) => columns),
      tap((ev) => this.onColumnsConfigurationChange.emit(ev))
    )
  ).pipe(
    map((columnsToConfigure) =>
      columnsToConfigure.filter(({ visible }) => visible)
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  @Output() onColumnsConfigurationChange: EventEmitter<
    ImperiaTableColumn<TItem>[]
  > = new EventEmitter<ImperiaTableColumn<TItem>[]>();
  //#endregion COLUMNS TO CONFIGURE

  //#region LOADING
  public loading$ = this.columnsToConfigure$.pipe(
    map(() => new ImperiaTableLoading(false))
  );
  //#endregion LOADING

  constructor(
    @Host() @Inject(IMPERIA_TABLE_V2_HOST)
    private imperiaTable: ImperiaTableV2Host<TItem>,
    private translate: ImpTranslateService
  ) {}

  public applyColumnsConfiguration(
    columns: ImperiaTableColumn<TItem>[],
    columnsFromStorage: ColumnConfiguration[]
  ): ImperiaTableColumn<TItem>[] {
    const matchedColumns = columns.filter((col) => !col.configurable);
    columnsFromStorage.forEach((columnFromStorage) => {
      const columnToMatch = columns.find(
        (col) => col.field === columnFromStorage.field
      );
      if (columnToMatch) {
        columnToMatch.configuration.visible = columnFromStorage.visible;
        columnToMatch.configuration.frozen = columnFromStorage.frozen;
        columnToMatch.configuration.frozenPosition =
          columnFromStorage.frozenPosition;
        matchedColumns.push(columnToMatch);
      }
    });

    return Array.from(new Set(matchedColumns.concat(columns)));
  }

  public setColumnsConfigurationToStorage(
    key: string | undefined,
    columns: ImperiaTableColumn<TItem>[]
  ): void {
    if (!key) return;
    const columnsSaved = columns
      .filter((col) => col.configurable)
      .map(({ configuration }) => ({
        field: configuration.field,
        frozen: configuration.frozen,
        frozenPosition: configuration.frozenPosition,
        visible: configuration.visible,
      }));
    localStorage.setItem(
      key + '_columnsConfiguration',
      JSON.stringify(columnsSaved)
    );
  }

  public getColumnsConfigurationFromStorage(
    storageKey: string | undefined
  ): ColumnConfiguration[] {
    try {
      if (!storageKey) return [];
      const columns = localStorage.getItem(
        storageKey + '_columnsConfiguration'
      );
      if (!columns) return [];
      return JSON.parse(columns);
    } catch (error) {
      localStorage.removeItem(storageKey + '_columnsConfiguration');
      return [];
    }
  }

  private swapColumns(
    columns: ImperiaTableColumn<TItem>[],
    indexA: number,
    indexB: number
  ): ImperiaTableColumn<TItem>[] {
    const columnA = columns[indexA];
    columns[indexA] = columns[indexB];
    columns[indexB] = columnA;
    return columns;
  }

  private canBeMoved(
    columns: ImperiaTableColumn<TItem>[],
    columnToMove: ImperiaTableColumn<TItem>,
    indexOfColumnToMove: number,
    direction: ColumnsConfiguratorMoveEventDirection
  ): boolean {
    const { configuration } = columnToMove;
    const indexOfLastLeftFrozenColumn = this.getIndexOfFrozenColumn(
      columns,
      'last',
      'left'
    );
    const indexOfLastRightFrozenColumn = this.getIndexOfFrozenColumn(
      columns,
      'last',
      'right'
    );
    const indexOfFirstRightFrozenColumn = this.getIndexOfFrozenColumn(
      columns,
      'first',
      'right'
    );
    // Column to move is Right Frozen
    if (configuration.frozen && configuration.frozenPosition === 'right') {
      if (
        direction === 'up' &&
        indexOfFirstRightFrozenColumn === indexOfColumnToMove
      )
        return false;
      if (
        direction === 'down' &&
        indexOfLastRightFrozenColumn === indexOfColumnToMove
      ) {
        return false;
      }
      // Column to move is Left Frozen
    } else if (
      configuration.frozen &&
      configuration.frozenPosition === 'left'
    ) {
      if (
        direction === 'down' &&
        indexOfColumnToMove === indexOfLastLeftFrozenColumn
      )
        return false;
      // Column to move is Unfrozen
    } else if (!configuration.frozen) {
      const isBeforeLastLeftFrozen =
        indexOfLastLeftFrozenColumn &&
        indexOfColumnToMove - 1 <= indexOfLastLeftFrozenColumn;

      const isBeforeLastRightFrozen =
        indexOfLastRightFrozenColumn &&
        indexOfColumnToMove - 1 <= indexOfLastRightFrozenColumn;

      if (
        direction === 'up' &&
        (isBeforeLastLeftFrozen || isBeforeLastRightFrozen)
      )
        return false;
    }

    return true;
  }

  private getIndexOfFrozenColumn(
    columns: ImperiaTableColumn<TItem>[],
    columnPosition: 'first' | 'last',
    columnFrozenPosition: 'left' | 'right'
  ): number | undefined {
    const columnsFiltered = columns
      .map((col, index) => ({
        frozen: col.configuration.frozen,
        frozenPosition: col.configuration.frozenPosition,
        index,
      }))
      .filter(
        (col) => col.frozen && col.frozenPosition === columnFrozenPosition
      )
      .map((col) => col.index);

    if (columnFrozenPosition === 'right' && !columnsFiltered.length)
      return this.getIndexOfFrozenColumn(columns, 'last', 'left');

    return columnPosition === 'first'
      ? columnsFiltered.shift()
      : columnsFiltered.pop();
  }

  private getIndexOfColumnInOriginalColumns(
    columns: ImperiaTableColumn<TItem>[],
    columnsToConfigure: ImperiaTableColumn<TItem>[],
    columnToMove: ImperiaTableColumn<TItem>
  ): number | undefined {
    const indexOfLastFrozenColumn = this.getIndexOfFrozenColumn(
      columnsToConfigure,
      'last',
      'right'
    );
    const previousIndexInOriginalColums =
      columns
        .filter((col) => col.visible)
        .findIndex((col) => col.field === columnToMove.field) - 1;

    return indexOfLastFrozenColumn &&
      previousIndexInOriginalColums <= indexOfLastFrozenColumn
      ? indexOfLastFrozenColumn
      : previousIndexInOriginalColums;
  }
}
