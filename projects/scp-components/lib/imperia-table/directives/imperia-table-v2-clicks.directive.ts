import { Directive, Host, Inject, Output } from '@angular/core';
import { ImperiaTableV2CellOverlayRef } from '../components/imperia-table-v2-cell-overlay/imperia-table-v2-cell-overlay.component';
import { IMPERIA_TABLE_V2_HOST } from '../../shared/template-apis/imperia-table.tokens';
import type { ImperiaTableV2Host } from '../../shared/template-apis/imperia-table.tokens';
import { _ImperiaTableV2CellInternalSelection } from '../components/imperia-table-v2-selection/imperia-table-v2-cell-selection/imperia-table-v2-cell-selection.component';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';
import {
  Observable,
  Subject,
  buffer,
  bufferCount,
  combineLatest,
  debounceTime,
  filter,
  first,
  map,
  merge,
  race,
  repeat,
  share,
  shareReplay,
  startWith,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';

export type ImperiaTableV2ClickEvent<TItem extends object> = {
  event: MouseEvent;
  element: HTMLTableCellElement;
  fromFooter: boolean;
  row: ImperiaTableRow<TItem>;
  rowIndex: number;
  col: ImperiaTableColumn<TItem>;
  colIndex: number;
  rowSelection: TItem[];
  rowIsSelected: boolean;
  cellSelection: _ImperiaTableV2CellInternalSelection<TItem>;
  cellIsSelected: boolean;
  rows: ImperiaTableRow<TItem>[];
  footerRows: ImperiaTableRow<TItem>[];
  set: (data: Partial<TItem>) => void;
  overlay?: ImperiaTableV2CellOverlayRef<TItem>;
};

@Directive({
  selector: 'imperia-table-v2-clicks',
    standalone: false
})
export class ImperiaTableV2ClicksDirective<TItem extends object> {
  //#region CLICK
  private _click = new Subject<{
    event: MouseEvent;
    element: HTMLTableCellElement;
    fromFooter: boolean;
    row: ImperiaTableRow<TItem>;
    rowIndex: number;
    col: ImperiaTableColumn<TItem>;
    colIndex: number;
  }>();

  private singleClicked$ = this._click.pipe(debounceTime(250));

  private doubleClicked$ = this._click.pipe(bufferCount(2));

  private clicked$ = race(this.singleClicked$, this.doubleClicked$).pipe(
    first(),
    repeat(),
  );

  private clickType$ = this._click.pipe(
    buffer(this.clicked$),
    map((clicks) =>
      clicks.length > 1
        ? { ...clicks[1], type: 'double' as const }
        : { ...clicks[0], type: 'single' as const },
    ),
  );

  private clickEvent$: Observable<
    ImperiaTableV2ClickEvent<TItem> & { type: 'single' | 'double' }
  > = this.clickType$.pipe(
    withLatestFrom(
      this.table.rowSelection$,
      this.table.isRowSelectedFn$,
      this.table.cellSelection$,
      this.table.isCellSelectedFn$,
      this.table.rows$,
      this.table.footerRows$,
    ),
    map(
      ([
        event,
        rowSelection,
        isRowSelectedFn,
        cellSelection,
        isSelectedCellFn,
        rows,
        footerRows,
      ]) => ({
        ...event,
        rowSelection,
        rowIsSelected: isRowSelectedFn(event.row, rowSelection),
        cellSelection,
        cellIsSelected: isSelectedCellFn(event.row, event.col, cellSelection),
        rows,
        footerRows,
        set: (data: Partial<TItem>) => {
          Object.assign(event.row.data, data);
          //Se actualiza el valor de la celda
          event.row.cells[event.col.field].value =
            data[event.col.field] ?? null;
          //Se actualiza el valor del control
          event.row.cells[event.col.field].control.setValue(
            event.row.cells[event.col.field].value,
            {
              emitEvent: false,
            },
          );
          //Se emite el evento de renderizado de la fila
          this.table.onRowRenderEmitter.emit(event.row);
        },
      }),
    ),
    share(),
  );

  public click$ = this._click.pipe(
    withLatestFrom(
      this.table.rowSelection$,
      this.table.isRowSelectedFn$,
      this.table.cellSelection$,
      this.table.isCellSelectedFn$,
      this.table.rows$,
      this.table.footerRows$,
    ),
    map(
      ([
        event,
        rowSelection,
        isRowSelectedFn,
        cellSelection,
        isCellSelectedFn,
        rows,
        footerRows,
      ]) => ({
        ...event,
        rowSelection,
        rowIsSelected: isRowSelectedFn(event.row, rowSelection),
        cellSelection,
        cellIsSelected: isCellSelectedFn(event.row, event.col, cellSelection),
        rows,
        footerRows,
        set: (data: Partial<TItem>) => {
          Object.assign(event.row.data, data);
          //Se actualiza el valor de la celda
          event.row.cells[event.col.field].value =
            data[event.col.field] ?? null;
          //Se actualiza el valor del control
          event.row.cells[event.col.field].control.setValue(
            event.row.cells[event.col.field].value,
            {
              emitEvent: false,
            },
          );
          //Se emite el evento de renderizado de la fila
          this.table.onRowRenderEmitter.emit(event.row);
        },
      }),
    ),
    share(),
  );

  @Output('sglClick') public singleClick$: Observable<
    ImperiaTableV2ClickEvent<TItem>
  > = this.clickEvent$.pipe(
    filter(({ type }) => type === 'single'),
    map(({ type, ...event }) => event),
    share(),
  );

  @Output('dblClick') public doubleClick$: Observable<
    ImperiaTableV2ClickEvent<TItem>
  > = this.clickEvent$.pipe(
    filter(({ type }) => type === 'double'),
    map(({ type, ...event }) => event),
    share(),
  );
  //#endregion CLICK

  //#region CONTEXT MENU
  private _contextMenu = new Subject<{
    event: MouseEvent;
    element: HTMLTableCellElement;
    fromFooter: boolean;
    row: ImperiaTableRow<TItem>;
    rowIndex: number;
    col: ImperiaTableColumn<TItem>;
    colIndex: number;
  }>();

  private contextMenuEvent$ = this._contextMenu.pipe(
    withLatestFrom(
      this.table.rowSelection$,
      this.table.isRowSelectedFn$,
      this.table.cellSelection$,
      this.table.isCellSelectedFn$,
      this.table.rows$,
      this.table.footerRows$,
    ),
    map(
      ([
        event,
        rowSelection,
        isRowSelectedFn,
        cellSelection,
        isSelectedCellFn,
        rows,
        footerRows,
      ]) => ({
        ...event,
        rowSelection,
        rowIsSelected: isRowSelectedFn(event.row, rowSelection),
        cellSelection,
        cellIsSelected: isSelectedCellFn(event.row, event.col, cellSelection),
        rows,
        footerRows,
        set: (data: Partial<TItem>) => {
          Object.assign(event.row.data, data);
          //Se actualiza el valor de la celda
          event.row.cells[event.col.field].value =
            data[event.col.field] ?? null;
          //Se actualiza el valor del control
          event.row.cells[event.col.field].control.setValue(
            event.row.cells[event.col.field].value,
            {
              emitEvent: false,
            },
          );
          //Se emite el evento de renderizado de la fila
          this.table.onRowRenderEmitter.emit(event.row);
        },
      }),
    ),
    share(),
  );

  @Output('contextMenu') public contextMenu$: Observable<
    ImperiaTableV2ClickEvent<TItem>
  > = this.contextMenuEvent$.pipe(share());
  //#endregion CONTEXT MENU

  //#region LAST CELL CLICKED
  private lastCellClickedFromRowOrColumnsChange$ = combineLatest([
    this.table.rows$,
    this.table.orderedColumns$,
  ]).pipe(
    switchMap(([rows, { columns }]) =>
      this.lastCellClicked$.pipe(
        take(1),
        map((lastCellSelection) => {
          if (!lastCellSelection) return null;
          const row = rows.find(
            (row) => row.dataKeyValue == lastCellSelection.row.dataKeyValue,
          );
          if (!row) return null;
          const col = columns.find(
            (column) => column.field == lastCellSelection.col.field,
          );
          if (!col) return null;
          return lastCellSelection;
        }),
      ),
    ),
  );

  public lastCellClicked$: Observable<{
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
  } | null> = merge(
    merge(
      this._click.pipe(filter(({ event }) => !event.shiftKey)),
      this._contextMenu,
    ).pipe(map(({ row, col }) => ({ row, col }))),
    this.lastCellClickedFromRowOrColumnsChange$,
  ).pipe(startWith(null), shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion LAST CELL CLICKED

  constructor(@Host() @Inject(IMPERIA_TABLE_V2_HOST) private table: ImperiaTableV2Host<TItem>) {}

  public click(
    event: MouseEvent,
    element: HTMLTableCellElement,
    fromFooter: boolean,
    row: ImperiaTableRow<TItem>,
    rowIndex: number,
    col: ImperiaTableColumn<TItem>,
    colIndex: number,
  ) {
    this._click.next({
      event,
      element,
      fromFooter,
      row,
      rowIndex,
      col,
      colIndex,
    });
  }

  public contextMenu(
    event: MouseEvent,
    element: HTMLTableCellElement,
    fromFooter: boolean,
    row: ImperiaTableRow<TItem>,
    rowIndex: number,
    col: ImperiaTableColumn<TItem>,
    colIndex: number,
  ) {
    this._contextMenu.next({
      event,
      element,
      fromFooter,
      row,
      rowIndex,
      col,
      colIndex,
    });
  }
}
