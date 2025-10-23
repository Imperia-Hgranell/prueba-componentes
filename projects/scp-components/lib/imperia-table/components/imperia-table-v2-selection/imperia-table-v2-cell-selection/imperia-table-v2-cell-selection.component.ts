import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ImpResizeEvent } from '@imperiascm/dom-utils';
import { httpRequestState, withValueFrom } from '@imperiascm/rxjs-utils';
import { EXPAND_FADEIN_COLLAPSED } from '@imperiascm/scp-utils/animations';
import { FADEIN } from '@imperiascm/scp-utils/animations';
import { ImperiaTableV2BaseSelectionDirective } from '../imperia-table-v2-selection.directive';
import { ImperiaTableColumn } from '../../../models/imperia-table-columns.models';
import { TImperiaTableColumnField } from '../../../models/imperia-table-columns.types';
import { ImperiaTableRow } from '../../../models/imperia-table-rows.models';
import { ImperiaTableBodyCellContextMenuContext } from '../../../template-directives/imperia-table-body-cell-context-menu-template.directive';
import { isTruthy } from '@imperiascm/scp-utils/functions';
import saveAs from 'file-saver';
import {
  animationFrameScheduler,
  asapScheduler,
  BehaviorSubject,
  catchError,
  combineLatest,
  combineLatestWith,
  concatMap,
  debounceTime,
  defer,
  delay,
  distinctUntilChanged,
  endWith,
  filter,
  finalize,
  first,
  from,
  interval,
  last,
  map,
  merge,
  Observable,
  of,
  pairwise,
  reduce,
  repeat,
  ReplaySubject,
  scheduled,
  share,
  shareReplay,
  skip,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
  takeWhile,
  tap,
  withLatestFrom,
  zipWith,
} from 'rxjs';
import { CellCorner } from '@imperiascm/scp-utils/models';

export type _ImperiaTableV2CellInternalSelection<TItem extends object> = Map<
  ImperiaTableRow<TItem>['dataKeyValue'],
  TImperiaTableColumnField<TItem>[]
>;

export type ImperiaTableV2CellSelection<TItem extends object> = {
  row: ImperiaTableRow<TItem>;
  cells: {
    col: ImperiaTableColumn<TItem>;
    state: (state: httpRequestState) => void;
    set: (data: Partial<TItem>) => void;
    render: () => void;
  }[];
  fromFooter: boolean;
}[];

class CopyingCellsVM {
  state: boolean;
  from: 'cell' | 'selection' | null;
  totalCellsToCopy: number;
  result: boolean | null;
  constructor(copying: Partial<CopyingCellsVM> = {}) {
    this.state = copying.state ?? false;
    this.from = copying.from ?? null;
    this.totalCellsToCopy = copying.totalCellsToCopy ?? 0;
    this.result = copying.result ?? null;
  }
}

interface ImperiaTableV2CellSelectionTemplateContext<TItem extends object> {
  $implicit: { open: (name: string) => boolean };
}

@Directive({
  selector: '[imperia-table-v2-cell-selection-template]',
  standalone: false,
})
export class ImperiaTableV2CellSelectionTemplateDirective<
  TItem extends object
> {
  @Input('imperia-table-v2-cell-selection-template') type!:
    | 'context-menu'
    | 'content';
  @Input() name!: string;

  constructor(
    public template: TemplateRef<
      ImperiaTableV2CellSelectionTemplateContext<TItem>
    >
  ) {}

  static ngTemplateContextGuard<TItem extends object>(
    dir: ImperiaTableV2CellSelectionTemplateDirective<TItem>,
    ctx: unknown
  ): ctx is ImperiaTableV2CellSelectionTemplateContext<TItem> {
    return true;
  }
}

@Component({
  selector: 'imperia-table-v2-cell-selection',
  templateUrl: './imperia-table-v2-cell-selection.component.html',
  styleUrls: ['./imperia-table-v2-cell-selection.component.scss'],
  animations: [FADEIN, EXPAND_FADEIN_COLLAPSED],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV2CellSelectionComponent<TItem extends object>
  extends ImperiaTableV2BaseSelectionDirective<TItem>
  implements OnInit, OnDestroy
{
  @ViewChild('copyTemplate') public copyTemplate!: TemplateRef<
    ImperiaTableBodyCellContextMenuContext<TItem>
  >;

  //#region LOADING OR BLOCKED
  public loadingOrBlocked$ = merge(
    this.table.loading$,
    this.table.blocked$
  ).pipe(
    map(({ state }) => state),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LOADING OR BLOCKED

  //#region IS SELECTED FUNCTION
  @Input('isSelectedFn') isSelected = (
    row: ImperiaTableRow<TItem>,
    col: ImperiaTableColumn<TItem>,
    currentSelection: _ImperiaTableV2CellInternalSelection<TItem> | null
  ) => {
    if (currentSelection === null) return false;
    if (currentSelection.size === 0) return false;
    return currentSelection.get(row.dataKeyValue)?.includes(col.field) ?? false;
  };
  //#endregion IS SELECTED FUNCTION

  //#region KEYBOARD EVENTS
  public onArrowRight$ = this.onKeyDown$.pipe(
    filter(({ event }) => event.code == 'ArrowRight')
  );
  public onArrowLeft$ = this.onKeyDown$.pipe(
    filter(({ event }) => event.code == 'ArrowLeft')
  );
  public onSpace$ = this.onKeyDown$.pipe(
    filter(({ event }) => event.code == 'Space')
  );
  //#endregion KEYBOARD EVENTS

  //#region FROM INPUT
  @Input('selection') set selectionSetter(
    v: _ImperiaTableV2CellInternalSelection<TItem> | null
  ) {
    if (!v) return;
    this.selection.next(v);
  }
  private selection = new BehaviorSubject<
    _ImperiaTableV2CellInternalSelection<TItem>
  >({} as any);
  //#endregion FROM INPUT

  //#region FROM VALUE CHANGE
  private selectionFromValueChange$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.table.value.pipe(
    switchMap((items) =>
      this.selection$.pipe(
        take(1),
        map((currentSelection) =>
          items.reduce((newSelection, item) => {
            const dataKeyValue = this.table.dataKeyValue(item);
            const fields = currentSelection.get(dataKeyValue);
            if (fields) newSelection.set(dataKeyValue, fields);
            return newSelection;
          }, new Map())
        )
      )
    )
  );
  //#endregion FROM VALUE CHANGE

  //#region FROM COLUMNS CHANGE
  private selectionFromColumnsChange$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.table.orderedColumns$.pipe(
    switchMap(({ columns }) =>
      this.selection$.pipe(
        take(1),
        tap((currentSelection) =>
          currentSelection.forEach((fields, dataKeyValue) =>
            currentSelection.set(
              dataKeyValue,
              fields.filter((field) =>
                columns.some((col) => col.field == field)
              )
            )
          )
        )
      )
    )
  );
  //#endregion FROM COLUMNS CHANGE

  //#region FROM CLICK
  public select = (
    event: MouseEvent,
    row: ImperiaTableRow<TItem>,
    col: ImperiaTableColumn<TItem>
  ) =>
    this._select.next({
      event,
      row,
      col,
    });
  private _select = new Subject<{
    event: MouseEvent;
    row: ImperiaTableRow<TItem>;
    col: ImperiaTableColumn<TItem>;
  }>();
  private selectionFromClick$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = merge(this.table.click$, this._select).pipe(
    this.ifNotReadonly(),
    filter(({ event }) => !(event.ctrlKey || event.shiftKey)),
    map(({ row, col }) => new Map([[row.dataKeyValue, [col.field]]])),
    share()
  );
  //#endregion FROM CLICK

  //#region FROM CLICK WITH SHIFT
  private selectionFromClickWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = merge(
    this.table.click$,
    this._select.pipe(
      withLatestFrom(this.table.rows$, this.table.footerRows$),
      map(([{ event, row, col }, rows, footerRows]) => ({
        event,
        row,
        col,
        fromFooter: row.fromFooter,
        rows,
        footerRows,
      }))
    )
  ).pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    withLatestFrom(
      defer(() => this.selection$),
      defer(() =>
        merge(
          this.lastSelectionWithShift$.pipe(take(1)),
          this.lastSelectionWithShift$.pipe(skip(1), delay(0, asapScheduler))
        )
      ),
      defer(() => this.lastCellClickedDelayed$),
      this.table.orderedColumns$
    ),
    tap(([_, selection, lastSelectionWithShift]) =>
      this.removePreviousSelectionWithShift(selection, lastSelectionWithShift)
    ),
    map(
      ([
        { row, col, fromFooter, rows, footerRows },
        selection,
        ___,
        lastCellClicked,
        { columns },
      ]) =>
        this.selectionFromClickWithShift(
          row,
          col,
          lastCellClicked,
          fromFooter ? footerRows : rows,
          columns,
          selection
        )
    ),
    share()
  );

  private selectionFromClickWithShift(
    row: ImperiaTableRow<TItem>,
    col: ImperiaTableColumn<TItem>,
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    } | null,
    rows: ImperiaTableRow<TItem>[],
    columns: ImperiaTableColumn<TItem>[],
    currentSelection: _ImperiaTableV2CellInternalSelection<TItem> = new Map()
  ): _ImperiaTableV2CellInternalSelection<TItem> {
    if (!lastCellClicked) return currentSelection;
    const firstSelectedRowIndex = rows.findIndex(
      (_row) => _row.dataKeyValue === lastCellClicked.row.dataKeyValue
    );
    const lastSelectedRowIndex = rows.findIndex(
      (_row) => _row.dataKeyValue == row.dataKeyValue
    );
    const firstSelectedColIndex = columns.findIndex(
      (column) => lastCellClicked.col.field === column.field
    );
    const lastSelectedColIndex = columns.findIndex(
      (column) => column.field == col.field
    );

    const minRowIndex = Math.min(firstSelectedRowIndex, lastSelectedRowIndex);
    const maxRowIndex = Math.max(firstSelectedRowIndex, lastSelectedRowIndex);
    const minColIndex = Math.min(firstSelectedColIndex, lastSelectedColIndex);
    const maxColIndex = Math.max(firstSelectedColIndex, lastSelectedColIndex);

    const selectedRows = rows
      .slice(minRowIndex, maxRowIndex + 1)
      .map((row) => row.dataKeyValue);

    const selectedColumns = columns
      .slice(minColIndex, maxColIndex + 1)
      .map((column) => column.field);

    return selectedRows.reduce((selection, dataKeyValue) => {
      const fields = selection.get(dataKeyValue);
      selection.set(
        dataKeyValue,
        fields
          ? [
              ...fields,
              ...selectedColumns.filter((field) => !fields.includes(field)),
            ]
          : selectedColumns
      );
      return selection;
    }, new Map(currentSelection));
  }
  //#endregion FROM CLICK WITH SHIFT

  //#region FROM CLICK WITH CTRL
  private selectionFromClickWithCtrl$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = merge(this.table.click$, this._select).pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.ctrlKey),
    withLatestFrom(defer(() => this.selection$)),
    map(([{ row, col }, currentSelection]) => {
      const fields = currentSelection.get(row.dataKeyValue)!;
      const newSelection = new Map(currentSelection);
      if (this.isSelected(row, col, currentSelection)) {
        if (fields.length > 1) {
          newSelection.set(
            row.dataKeyValue,
            fields.filter((f) => f != col.field)
          );
        } else {
          newSelection.delete(row.dataKeyValue);
        }
        return newSelection;
      } else {
        newSelection.set(
          row.dataKeyValue,
          fields ? [...fields, col.field] : [col.field]
        );
      }
      return newSelection;
    }),
    share()
  );
  //#endregion FROM CLICK WITH CTRL

  //#region FROM CONTEXT MENU
  private selectionFromContextMenu$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.table.contextMenu$.pipe(
    this.ifNotReadonly(),
    map(({ row, col, cellSelection }) => {
      const isSelected = this.isSelected(row, col, cellSelection);
      if (isSelected) return cellSelection;
      return new Map([[row.dataKeyValue, [col.field]]]);
    })
  );
  //#endregion FROM CONTEXT MENU

  //#region FROM ROW SELECTOR CLICK
  public rowSelectorClick = new Subject<{
    event: MouseEvent;
    row: ImperiaTableRow<TItem>;
  }>();
  private selectionFromRowSelectorClick$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.rowSelectorClick.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => !(event.ctrlKey || event.shiftKey)),
    withLatestFrom(this.table.orderedColumns$),
    map(
      ([{ row }, { columns }]) =>
        new Map([[row.dataKeyValue, columns.map((col) => col.field)]])
    ),
    share()
  );
  //#endregion FROM ROW SELECTOR CLICK

  //#region LAST CELL CLICKED FROM ROW SELECTOR CLICK
  private lastCellClickedFromRowSelectorClick$: Observable<{
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
  }> = this.rowSelectorClick.pipe(
    filter(({ event }) => !event.shiftKey),
    withLatestFrom(this.table.orderedColumns$),
    map(([{ row }, { columns }]) => ({
      row,
      col: columns[0],
    }))
  );
  //#endregion LAST CELL CLICKED FROM ROW SELECTOR CLICK

  //#region FROM ROW SELECTOR CLICK WITH SHIFT
  private selectionFromRowSelectorClickWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.rowSelectorClick.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    withLatestFrom(
      defer(() => this.selection$),
      defer(() =>
        merge(
          this.lastSelectionWithShift$.pipe(take(1)),
          this.lastSelectionWithShift$.pipe(skip(1), delay(0, asapScheduler))
        )
      ),
      defer(() => this.lastCellClickedDelayed$),
      this.table.rows$,
      this.table.footerRows$,
      this.table.orderedColumns$
    ),
    tap(([_, selection, lastSelectionWithShift]) =>
      this.removePreviousSelectionWithShift(selection, lastSelectionWithShift)
    ),
    map(
      ([
        { row },
        selection,
        ___,
        lastCellClicked,
        rows,
        footerRows,
        { columns },
      ]) =>
        this.selectionFromRowSelectorClickWithShift(
          row,
          lastCellClicked,
          row.fromFooter ? footerRows : rows,
          columns,
          selection
        )
    ),
    share()
  );

  private selectionFromRowSelectorClickWithShift(
    row: ImperiaTableRow<TItem>,
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    } | null,
    rows: ImperiaTableRow<TItem>[],
    columns: ImperiaTableColumn<TItem>[],
    currentSelection: _ImperiaTableV2CellInternalSelection<TItem> = new Map()
  ) {
    if (!lastCellClicked) return currentSelection;
    const firstSelectedRowIndex = rows.findIndex(
      (_row) => _row.dataKeyValue === lastCellClicked.row.dataKeyValue
    );
    const lastSelectedRowIndex = rows.findIndex(
      (_row) => _row.dataKeyValue == row.dataKeyValue
    );
    const minRowIndex = Math.min(firstSelectedRowIndex, lastSelectedRowIndex);
    const maxRowIndex = Math.max(firstSelectedRowIndex, lastSelectedRowIndex);

    const selectedRows = rows
      .slice(minRowIndex, maxRowIndex + 1)
      .map((row) => row.dataKeyValue);

    return selectedRows.reduce((selection, dataKeyValue) => {
      const fields = selection.get(dataKeyValue);
      selection.set(
        dataKeyValue,
        fields
          ? [
              ...fields,
              ...columns
                .map((col) => col.field)
                .filter((f) => !fields.includes(f)),
            ]
          : columns.map((col) => col.field)
      );
      return selection;
    }, new Map(currentSelection));
  }
  //#endregion FROM ROW SELECTOR CLICK WITH SHIFT

  //#region FROM ROW SELECTOR CLICK WITH CTRL
  private selectionFromRowSelectorClickWithCtrl$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.rowSelectorClick.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.ctrlKey),
    withLatestFrom(
      defer(() => this.selection$),
      this.table.orderedColumns$
    ),
    map(([{ row }, currentSelection, { columns }]) => {
      const newSelection = new Map(currentSelection);
      if (columns.every((col) => this.isSelected(row, col, currentSelection))) {
        newSelection.delete(row.dataKeyValue);
      } else {
        newSelection.set(
          row.dataKeyValue,
          columns.map((col) => col.field)
        );
      }
      return newSelection;
    })
  );
  //#endregion FROM ROW SELECTOR CLICK WITH CTRL

  //#region FROM COL SELECTOR CLICK
  public colSelectorClick = new Subject<{
    event: MouseEvent;
    col: ImperiaTableColumn<TItem>;
  }>();
  private selectionFromColSelectorClick$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.colSelectorClick.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => !(event.ctrlKey || event.shiftKey)),
    withLatestFrom(this.table.rows$),
    map(
      ([{ col }, rows]) =>
        new Map(rows.map((row) => [row.dataKeyValue, [col.field]]))
    ),
    share()
  );
  //#endregion FROM COL SELECTOR CLICK

  //#region LAST CELL CLICKED FROM COL SELECTOR CLICK
  private lastCellClickedFromColSelectorClick$: Observable<{
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
  }> = this.colSelectorClick.pipe(
    filter(({ event }) => !event.shiftKey),
    withLatestFrom(this.table.rows$),
    map(([{ col }, rows]) => ({
      row: rows[0],
      col,
    }))
  );
  //#endregion LAST CELL CLICKED FROM COL SELECTOR CLICK

  //#region FROM COL SELECTOR CLICK WITH SHIFT
  private selectionFromColSelectorClickWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.colSelectorClick.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    withLatestFrom(
      defer(() => this.selection$),
      defer(() =>
        merge(
          this.lastSelectionWithShift$.pipe(take(1)),
          this.lastSelectionWithShift$.pipe(skip(1), delay(0, asapScheduler))
        )
      ),
      defer(() => this.lastCellClickedDelayed$),
      this.table.rows$,
      this.table.orderedColumns$
    ),
    tap(([_, selection, lastSelectionWithShift]) =>
      this.removePreviousSelectionWithShift(selection, lastSelectionWithShift)
    ),
    map(([{ col }, selection, ___, lastCellClicked, rows, { columns }]) =>
      this.selectionFromColSelectorClickWithShift(
        col,
        lastCellClicked,
        rows,
        columns,
        selection
      )
    ),
    share()
  );

  private selectionFromColSelectorClickWithShift(
    col: ImperiaTableColumn<TItem>,
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    } | null,
    rows: ImperiaTableRow<TItem>[],
    columns: ImperiaTableColumn<TItem>[],
    currentSelection: _ImperiaTableV2CellInternalSelection<TItem> = new Map()
  ) {
    if (!lastCellClicked) return currentSelection;
    const firstSelectedColIndex = columns.findIndex(
      (column) => column.field === lastCellClicked.col.field
    );
    const lastSelectedColIndex = columns.findIndex(
      (column) => column.field == col.field
    );
    const minColIndex = Math.min(firstSelectedColIndex, lastSelectedColIndex);
    const maxColIndex = Math.max(firstSelectedColIndex, lastSelectedColIndex);

    const selectedFields = columns
      .slice(minColIndex, maxColIndex + 1)
      .map((col) => col.field);

    return rows.reduce((selection, row) => {
      const fields = selection.get(row.dataKeyValue);
      selection.set(
        row.dataKeyValue,
        fields
          ? [
              ...fields,
              ...selectedFields.filter((field) => !fields.includes(field)),
            ]
          : selectedFields
      );
      return selection;
    }, new Map(currentSelection));
  }
  //#endregion FROM COL SELECTOR CLICK WITH SHIFT

  //#region FROM COL SELECTOR CLICK WITH CTRL
  private selectionFromColSelectorClickWithCtrl$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.colSelectorClick.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.ctrlKey),
    withLatestFrom(
      defer(() => this.selection$),
      this.table.rows$
    ),
    map(([{ col }, currentSelection, rows]) => {
      const newSelection = new Map(currentSelection);
      if (rows.every((row) => this.isSelected(row, col, currentSelection))) {
        rows.forEach((row) => {
          const fields = newSelection.get(row.dataKeyValue);
          if (!fields) {
            newSelection.delete(row.dataKeyValue);
            return;
          }
          if (fields.length === 1) {
            newSelection.delete(row.dataKeyValue);
            return;
          }
          newSelection.set(row.dataKeyValue, [
            ...fields.filter((f) => f != col.field),
          ]);
        });
      } else {
        rows.forEach((row) => {
          const fields = newSelection.get(row.dataKeyValue);
          if (!fields) {
            newSelection.set(row.dataKeyValue, [col.field]);
            return;
          }
          newSelection.set(row.dataKeyValue, [
            ...fields.filter((field) => field != col.field),
            col.field,
          ]);
        });
      }
      return newSelection;
    })
  );
  //#endregion FROM COL SELECTOR CLICK WITH CTRL

  //#region FROM SPACE WITH SHIFT
  private selectionFromSpaceWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onSpace$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() =>
        merge(
          this.lastSelectionWithShift$.pipe(take(1)),
          this.lastSelectionWithShift$.pipe(skip(1), delay(0, asapScheduler))
        )
      ),
      defer(() => this.lastCellClickedDelayed$),
      defer(() => this.selection$)
    ),
    map(
      ([
        { columns, rows, footerRows },
        lastSelectionWithShift,
        lastCellClicked,
        selection,
      ]) =>
        this.selectionFromSpaceWithShift(
          lastSelectionWithShift,
          lastCellClicked,
          rows,
          footerRows,
          columns,
          selection
        )
    )
  );

  private selectionFromSpaceWithShift(
    lastSelectionWithShift: _ImperiaTableV2CellInternalSelection<TItem>,
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    } | null,
    rows: ImperiaTableRow<TItem>[],
    footerRows: ImperiaTableRow<TItem>[],
    columns: ImperiaTableColumn<TItem>[],
    currentSelection: _ImperiaTableV2CellInternalSelection<TItem> = new Map()
  ): _ImperiaTableV2CellInternalSelection<TItem> {
    if (!lastCellClicked) return currentSelection;

    const rowsOrFooterRows = lastCellClicked.row.fromFooter ? footerRows : rows;

    const shiftRowsIndexes =
      lastSelectionWithShift.size > 0
        ? Array.from(lastSelectionWithShift.keys()).map((dataKeyValue) =>
            rowsOrFooterRows.findIndex(
              (row) => row.dataKeyValue == dataKeyValue
            )
          )
        : [
            rowsOrFooterRows.findIndex(
              (row) => row.dataKeyValue == lastCellClicked.row.dataKeyValue
            ),
          ];

    if (shiftRowsIndexes.length === 0) return currentSelection;

    const minRowIndex = Math.min(...shiftRowsIndexes);
    const maxRowIndex = Math.max(...shiftRowsIndexes);

    const selectedRows = rowsOrFooterRows
      .slice(minRowIndex, maxRowIndex + 1)
      .map((row) => row.dataKeyValue);

    return selectedRows.reduce(
      (selection, dataKeyValue) =>
        selection.set(
          dataKeyValue,
          columns.map((col) => col.field)
        ),
      new Map(currentSelection)
    );
  }
  //#endregion FROM SPACE WITH SHIFT

  //#region FROM SPACE WITH CTRL
  private selectionFromSpaceWithCtrl$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onSpace$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.ctrlKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() =>
        merge(
          this.lastSelectionWithShift$.pipe(take(1)),
          this.lastSelectionWithShift$.pipe(skip(1), delay(0, asapScheduler))
        )
      ),
      defer(() => this.lastCellClickedDelayed$),
      defer(() => this.selection$)
    ),
    map(
      ([
        { columns, rows, footerRows },
        lastSelectionWithShift,
        lastCellClicked,
        selection,
      ]) =>
        this.selectionFromSpaceWithCtrl(
          lastSelectionWithShift,
          lastCellClicked,
          rows,
          footerRows,
          columns,
          selection
        )
    )
  );

  private selectionFromSpaceWithCtrl(
    lastSelectionWithShift: _ImperiaTableV2CellInternalSelection<TItem>,
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    } | null,
    rows: ImperiaTableRow<TItem>[],
    footerRows: ImperiaTableRow<TItem>[],
    columns: ImperiaTableColumn<TItem>[],
    currentSelection: _ImperiaTableV2CellInternalSelection<TItem> = new Map()
  ): _ImperiaTableV2CellInternalSelection<TItem> {
    if (!lastCellClicked) return currentSelection;

    const shiftColumnsIndexes =
      lastSelectionWithShift.size > 0
        ? Array.from(lastSelectionWithShift.values())[0].map((field) =>
            columns.findIndex((column) => column.field == field)
          )
        : [
            columns.findIndex(
              (column) => column.field == lastCellClicked.col.field
            ),
          ];

    if (shiftColumnsIndexes.length === 0) return currentSelection;

    const minColIndex = Math.min(...shiftColumnsIndexes);
    const maxColIndex = Math.max(...shiftColumnsIndexes);

    const selectedColumns = columns
      .slice(minColIndex, maxColIndex + 1)
      .map((col) => col.field);

    const rowsOrFooterRows = lastCellClicked.row.fromFooter ? footerRows : rows;

    return rowsOrFooterRows.reduce((selection, row) => {
      const fields = selection.get(row.dataKeyValue);
      selection.set(
        row.dataKeyValue,
        fields
          ? [
              ...fields,
              ...selectedColumns.filter((field) => !fields.includes(field)),
            ]
          : selectedColumns
      );
      return selection;
    }, new Map(currentSelection));
  }
  //#endregion FROM SPACE WITH CTRL

  //#region LAST CELL CLICKED FROM ARROW UP
  private lastCellClickedFromArrowUp$: Observable<{
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
  }> = this.onArrowUp$.pipe(
    filter(({ event }) => !(event.shiftKey || event.ctrlKey)),
    this.preventAndStopPropagation(({ event }) => event),
    switchMap(({ rows }) =>
      this.lastCellClickedDelayed$.pipe(
        take(1),
        map((lastCellClicked) => {
          if (!lastCellClicked) return null;
          const lastRowClickedIndex = rows.findIndex(
            (row) => row.dataKeyValue == lastCellClicked.row.dataKeyValue
          );
          const row = rows[lastRowClickedIndex - 1];
          if (!row) return lastCellClicked;
          return { row, col: lastCellClicked.col };
        })
      )
    ),
    filter(Boolean)
  );
  //#endregion LAST CELL CLICKED FROM ARROW UP

  //#region FROM ARROW UP
  private selectionFromArrowUp$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowUp$.pipe(
    this.ifNotReadonly(),
    filter(({ event }) => !(event.ctrlKey || event.shiftKey)),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(defer(() => this.lastCellClickedDelayed$)),
    map(([{ rows }, lastCellClicked]) => {
      if (!lastCellClicked) return new Map();
      const lastRowClickedIndex = rows.findIndex(
        (row) => row.dataKeyValue == lastCellClicked.row.dataKeyValue
      );

      const row = rows[lastRowClickedIndex - 1];
      if (!row) {
        return new Map([
          [lastCellClicked.row.dataKeyValue, [lastCellClicked.col.field]],
        ]);
      }

      return new Map([[row.dataKeyValue, [lastCellClicked.col.field]]]);
    })
  );
  //#endregion FROM ARROW UP

  //#region FROM ARROW UP WITH SHIFT
  private selectionFromArrowUpWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowUp$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() => this.lastCellClickedDelayed$),
      defer(() =>
        merge(
          this.lastSelectionWithShift$.pipe(take(1)),
          this.lastSelectionWithShift$.pipe(skip(1), delay(0, asapScheduler))
        )
      ),
      defer(() => this.selection$)
    ),
    map(
      ([
        { rows, footerRows },
        lastCellClicked,
        lastSelectionWithShift,
        selection,
      ]) =>
        this.selectionFromArrowUpWithShift(
          lastCellClicked,
          lastSelectionWithShift,
          rows,
          footerRows,
          selection
        )
    )
  );

  private selectionFromArrowUpWithShift(
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    } | null,
    lastSelectionWithShift: _ImperiaTableV2CellInternalSelection<TItem>,
    rows: ImperiaTableRow<TItem>[],
    footerRows: ImperiaTableRow<TItem>[],
    currentSelection: _ImperiaTableV2CellInternalSelection<TItem> = new Map()
  ): _ImperiaTableV2CellInternalSelection<TItem> {
    if (!lastCellClicked) return currentSelection;

    const rowsOrFooterRows = lastCellClicked.row.fromFooter ? footerRows : rows;

    const fields = Array.from(lastSelectionWithShift.values())[0] ?? [
      lastCellClicked.col.field,
    ];

    const lastRowClickedIndex = rowsOrFooterRows.findIndex(
      (row) => row.dataKeyValue == lastCellClicked.row.dataKeyValue
    );

    if (
      lastSelectionWithShift.size === 0 ||
      lastSelectionWithShift.size === 1
    ) {
      const selectedRow = rowsOrFooterRows[lastRowClickedIndex - 1];
      if (!selectedRow) {
        return currentSelection;
      }
      const rowFields = currentSelection.get(selectedRow.dataKeyValue);
      return new Map(currentSelection).set(
        selectedRow.dataKeyValue,
        rowFields
          ? [
              ...rowFields,
              ...fields.filter((field) => !rowFields.includes(field)),
            ]
          : fields
      );
    }

    const selectedRowsMinIndex = Math.min(
      ...Array.from(lastSelectionWithShift.keys()).map((dataKeyValue) =>
        rowsOrFooterRows.findIndex((row) => row.dataKeyValue == dataKeyValue)
      )
    );

    const lastSelectionWithShiftIsAboveLastCellClicked =
      lastRowClickedIndex > selectedRowsMinIndex;

    if (lastSelectionWithShiftIsAboveLastCellClicked) {
      const row = rowsOrFooterRows[selectedRowsMinIndex - 1];
      if (!row) {
        return currentSelection;
      }
      const currentRowFields = currentSelection.get(row.dataKeyValue);
      return new Map(currentSelection).set(
        row.dataKeyValue,
        currentRowFields
          ? [
              ...currentRowFields,
              ...fields.filter((field) => !currentRowFields.includes(field)),
            ]
          : fields
      );
    } else {
      const selectedRowsMaxIndex = Math.max(
        ...Array.from(lastSelectionWithShift.keys()).map((dataKeyValue) =>
          rowsOrFooterRows.findIndex((row) => row.dataKeyValue == dataKeyValue)
        )
      );
      const row = rowsOrFooterRows[selectedRowsMaxIndex];
      if (!row) {
        return currentSelection;
      }
      const currentRowFields = currentSelection.get(row.dataKeyValue);
      const newRowFields = currentRowFields
        ? currentRowFields.filter((f) => !fields.includes(f))
        : [];
      if (newRowFields.length > 0) {
        return new Map(currentSelection).set(row.dataKeyValue, newRowFields);
      }
      const newSelection = new Map(currentSelection);
      newSelection.delete(row.dataKeyValue);
      return newSelection;
    }
  }
  //#endregion FROM ARROW UP WITH SHIFT

  //#region LAST CELL CLICKED FROM ARROW RIGHT
  private lastCellClickedFromArrowRight$: Observable<{
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
  }> = this.onArrowRight$.pipe(
    filter(({ event }) => !(event.shiftKey || event.ctrlKey)),
    this.preventAndStopPropagation(({ event }) => event),
    switchMap(({ columns }) =>
      this.lastCellClickedDelayed$.pipe(
        take(1),
        map((lastCellClicked) => {
          if (!lastCellClicked) return null;
          const lastColClickedIndex = columns.findIndex(
            (col) => col.field == lastCellClicked.col.field
          );
          const col = columns[lastColClickedIndex + 1];
          if (!col) return lastCellClicked;
          return { row: lastCellClicked.row, col };
        })
      )
    ),
    filter(Boolean)
  );
  //#endregion LAST CELL CLICKED FROM ARROW RIGHT

  //#region FROM ARROW RIGHT
  private selectionFromArrowRight$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowRight$.pipe(
    this.ifNotReadonly(),
    filter(({ event }) => !(event.ctrlKey || event.shiftKey)),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(defer(() => this.lastCellClickedDelayed$)),
    map(([{ columns }, lastCellClicked]) => {
      if (!lastCellClicked) return new Map();
      const lastColClickedIndex = columns.findIndex(
        (column) => column.field == lastCellClicked.col.field
      );

      const col = columns[lastColClickedIndex + 1];
      if (!col) {
        return new Map([
          [lastCellClicked.row.dataKeyValue, [lastCellClicked.col.field]],
        ]);
      }

      return new Map([[lastCellClicked.row.dataKeyValue, [col.field]]]);
    })
  );
  //#endregion FROM ARROW RIGHT

  //#region FROM ARROW RIGHT WITH SHIFT
  private selectionFromArrowRightWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowRight$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() => this.lastCellClickedDelayed$),
      defer(() =>
        merge(
          this.lastSelectionWithShift$.pipe(take(1)),
          this.lastSelectionWithShift$.pipe(skip(1), delay(0, asapScheduler))
        )
      ),
      defer(() => this.selection$)
    ),
    map(([{ columns }, lastCellClicked, lastSelectionWithShift, selection]) =>
      this.selectionFromArrowRightWithShift(
        lastCellClicked,
        lastSelectionWithShift,
        columns,
        selection
      )
    )
  );

  private selectionFromArrowRightWithShift(
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    } | null,
    lastSelectionWithShift: _ImperiaTableV2CellInternalSelection<TItem>,
    columns: ImperiaTableColumn<TItem>[],
    currentSelection: _ImperiaTableV2CellInternalSelection<TItem> = new Map()
  ): _ImperiaTableV2CellInternalSelection<TItem> {
    if (!lastCellClicked) return currentSelection;

    const shiftFields = Array.from(lastSelectionWithShift.values())[0] ?? [
      lastCellClicked.col.field,
    ];

    const shiftFieldsIndexes = shiftFields.map((field) =>
      columns.findIndex((column) => column.field == field)
    );

    const lastColClickedIndex = columns.findIndex(
      (column) => column.field == lastCellClicked.col.field
    );

    if (shiftFields.length === 0 || shiftFields.length === 1) {
      const selectedCol = columns[lastColClickedIndex + 1];
      if (!selectedCol) {
        return currentSelection;
      }
      const newSelection = new Map(currentSelection);
      newSelection.forEach(
        (fields, dataKeyValue) =>
          lastSelectionWithShift.has(dataKeyValue) &&
          newSelection.set(dataKeyValue, [...fields, selectedCol.field])
      );
      return newSelection;
    }

    const selectedColsMinIndex = Math.min(...shiftFieldsIndexes);

    const lastSelectionWithShiftIsLeftToLastCellClicked =
      lastColClickedIndex > selectedColsMinIndex;

    if (lastSelectionWithShiftIsLeftToLastCellClicked) {
      const col = columns[selectedColsMinIndex];
      if (!col) {
        return currentSelection;
      }
      const newSelection = new Map(currentSelection);
      newSelection.forEach(
        (fields, dataKeyValue) =>
          lastSelectionWithShift.has(dataKeyValue) &&
          newSelection.set(dataKeyValue, [
            ...fields.filter((field) => field != col.field),
          ])
      );
      return newSelection;
    } else {
      const selectedColsMaxIndex = Math.max(...shiftFieldsIndexes);
      const col = columns[selectedColsMaxIndex + 1];
      if (!col) {
        return currentSelection;
      }
      const newSelection = new Map(currentSelection);
      newSelection.forEach(
        (fields, dataKeyValue) =>
          lastSelectionWithShift.has(dataKeyValue) &&
          newSelection.set(dataKeyValue, [...fields, col.field])
      );
      return newSelection;
    }
  }
  //#endregion FROM ARROW RIGHT

  //#region LAST CELL CLICKED FROM ARROW DOWN
  private lastCellClickedFromArrowDown$: Observable<{
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
  }> = this.onArrowDown$.pipe(
    filter(({ event }) => !(event.shiftKey || event.ctrlKey)),
    this.preventAndStopPropagation(({ event }) => event),
    switchMap(({ rows }) =>
      this.lastCellClickedDelayed$.pipe(
        take(1),
        map((lastCellClicked) => {
          if (!lastCellClicked) return null;
          const lastRowClickedIndex = rows.findIndex(
            (row) => row.dataKeyValue == lastCellClicked.row.dataKeyValue
          );
          const row = rows[lastRowClickedIndex + 1];
          if (!row) return lastCellClicked;
          return { row, col: lastCellClicked.col };
        })
      )
    ),
    filter(Boolean)
  );
  //#endregion LAST CELL CLICKED FROM ARROW DOWN

  //#region FROM ARROW DOWN
  private selectionFromArrowDown$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowDown$.pipe(
    this.ifNotReadonly(),
    filter(({ event }) => !(event.ctrlKey || event.shiftKey)),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(defer(() => this.lastCellClickedDelayed$)),
    map(([{ rows }, lastCellClicked]) => {
      if (!lastCellClicked) return new Map();
      const lastRowClickedIndex = rows.findIndex(
        (row) => row.dataKeyValue == lastCellClicked.row.dataKeyValue
      );

      const row = rows[lastRowClickedIndex + 1];
      if (!row) {
        return new Map([
          [lastCellClicked.row.dataKeyValue, [lastCellClicked.col.field]],
        ]);
      }

      return new Map([[row.dataKeyValue, [lastCellClicked.col.field]]]);
    })
  );
  //#endregion FROM ARROW DOWN

  //#region FROM ARROW DOWN WITH SHIFT
  private selectionFromArrowDownWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowDown$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() => this.lastCellClickedDelayed$),
      defer(() =>
        merge(
          this.lastSelectionWithShift$.pipe(take(1)),
          this.lastSelectionWithShift$.pipe(skip(1), delay(0, asapScheduler))
        )
      ),
      defer(() => this.selection$)
    ),
    map(
      ([
        { rows, footerRows },
        lastCellClicked,
        lastSelectionWithShift,
        selection,
      ]) =>
        this.selectionFromArrowDownWithShift(
          lastCellClicked,
          lastSelectionWithShift,
          rows,
          footerRows,
          selection
        )
    )
  );

  private selectionFromArrowDownWithShift(
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    } | null,
    lastSelectionWithShift: _ImperiaTableV2CellInternalSelection<TItem>,
    rows: ImperiaTableRow<TItem>[],
    footerRows: ImperiaTableRow<TItem>[],
    currentSelection: _ImperiaTableV2CellInternalSelection<TItem> = new Map()
  ): _ImperiaTableV2CellInternalSelection<TItem> {
    if (!lastCellClicked) return currentSelection;

    const rowsOrFooterRows = lastCellClicked.row.fromFooter ? footerRows : rows;

    const fields = Array.from(lastSelectionWithShift.values())[0] ?? [
      lastCellClicked.col.field,
    ];

    const lastRowClickedIndex = rowsOrFooterRows.findIndex(
      (row) => row.dataKeyValue == lastCellClicked.row.dataKeyValue
    );

    if (
      lastSelectionWithShift.size === 0 ||
      lastSelectionWithShift.size === 1
    ) {
      const selectedRow = rowsOrFooterRows[lastRowClickedIndex + 1];
      if (!selectedRow) {
        return currentSelection;
      }
      const rowFields = currentSelection.get(selectedRow.dataKeyValue);
      return new Map(currentSelection).set(
        selectedRow.dataKeyValue,
        rowFields
          ? [
              ...rowFields,
              ...fields.filter((field) => !rowFields.includes(field)),
            ]
          : fields
      );
    }

    const selectedRowsMinIndex = Math.min(
      ...Array.from(lastSelectionWithShift.keys()).map((dataKeyValue) =>
        rowsOrFooterRows.findIndex((row) => row.dataKeyValue == dataKeyValue)
      )
    );

    const lastSelectionWithShiftIsAboveLastCellClicked =
      lastRowClickedIndex > selectedRowsMinIndex;

    if (lastSelectionWithShiftIsAboveLastCellClicked) {
      const row = rowsOrFooterRows[selectedRowsMinIndex];
      if (!row) {
        return currentSelection;
      }
      const currentRowFields = currentSelection.get(row.dataKeyValue);
      const newRowFields = currentRowFields
        ? currentRowFields.filter((f) => !fields.includes(f))
        : [];
      if (newRowFields.length > 0) {
        return new Map(currentSelection).set(row.dataKeyValue, newRowFields);
      }
      const newSelection = new Map(currentSelection);
      newSelection.delete(row.dataKeyValue);
      return newSelection;
    } else {
      const selectedRowsMaxIndex = Math.max(
        ...Array.from(lastSelectionWithShift.keys()).map((dataKeyValue) =>
          rowsOrFooterRows.findIndex((row) => row.dataKeyValue == dataKeyValue)
        )
      );
      const row = rowsOrFooterRows[selectedRowsMaxIndex + 1];
      if (!row) {
        return currentSelection;
      }
      const currentRowFields = currentSelection.get(row.dataKeyValue);
      return new Map(currentSelection).set(
        row.dataKeyValue,
        currentRowFields
          ? [
              ...currentRowFields,
              ...fields.filter((field) => !currentRowFields.includes(field)),
            ]
          : fields
      );
    }
  }
  //#endregion FROM ARROW DOWN WITH SHIFT

  //#region LAST CELL CLICKED FROM ARROW LEFT
  private lastCellClickedFromArrowLeft$: Observable<{
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
  }> = this.onArrowLeft$.pipe(
    filter(({ event }) => !(event.shiftKey || event.ctrlKey)),
    this.preventAndStopPropagation(({ event }) => event),
    switchMap(({ columns }) =>
      this.lastCellClickedDelayed$.pipe(
        take(1),
        map((lastCellClicked) => {
          if (!lastCellClicked) return null;
          const lastColClickedIndex = columns.findIndex(
            (col) => col.field == lastCellClicked.col.field
          );
          const col = columns[lastColClickedIndex - 1];
          if (!col) return lastCellClicked;
          return { row: lastCellClicked.row, col };
        })
      )
    ),
    filter(Boolean)
  );
  //#endregion LAST CELL CLICKED FROM ARROW LEFT

  //#region FROM ARROW LEFT
  private selectionFromArrowLeft$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowLeft$.pipe(
    this.ifNotReadonly(),
    filter(({ event }) => !(event.ctrlKey || event.shiftKey)),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(defer(() => this.lastCellClickedDelayed$)),
    map(([{ columns }, lastCellClicked]) => {
      if (!lastCellClicked) return new Map();
      const lastColClickedIndex = columns.findIndex(
        (column) => column.field == lastCellClicked.col.field
      );

      const col = columns[lastColClickedIndex - 1];
      if (!col) {
        return new Map([
          [lastCellClicked.row.dataKeyValue, [lastCellClicked.col.field]],
        ]);
      }

      return new Map([[lastCellClicked.row.dataKeyValue, [col.field]]]);
    })
  );
  //#endregion FROM ARROW LEFT

  //#region FROM ARROW LEFT WITH SHIFT
  private selectionFromArrowLeftWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowLeft$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() => this.lastCellClickedDelayed$),
      defer(() =>
        merge(
          this.lastSelectionWithShift$.pipe(take(1)),
          this.lastSelectionWithShift$.pipe(skip(1), delay(0, asapScheduler))
        )
      ),
      defer(() => this.selection$)
    ),
    map(([{ columns }, lastCellClicked, lastSelectionWithShift, selection]) =>
      this.selectionFromArrowLeftWithShift(
        lastCellClicked,
        lastSelectionWithShift,
        columns,
        selection
      )
    )
  );

  private selectionFromArrowLeftWithShift(
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    } | null,
    lastSelectionWithShift: _ImperiaTableV2CellInternalSelection<TItem>,
    columns: ImperiaTableColumn<TItem>[],
    currentSelection: _ImperiaTableV2CellInternalSelection<TItem> = new Map()
  ): _ImperiaTableV2CellInternalSelection<TItem> {
    if (!lastCellClicked) return currentSelection;

    const shiftFields = Array.from(lastSelectionWithShift.values())[0] ?? [
      lastCellClicked.col.field,
    ];

    const shiftFieldsIndexes = shiftFields.map((field) =>
      columns.findIndex((column) => column.field == field)
    );

    const lastColClickedIndex = columns.findIndex(
      (column) => column.field == lastCellClicked.col.field
    );

    if (shiftFields.length === 0 || shiftFields.length === 1) {
      const selectedCol = columns[lastColClickedIndex - 1];
      if (!selectedCol) {
        return currentSelection;
      }
      const newSelection = new Map(currentSelection);
      newSelection.forEach(
        (fields, dataKeyValue) =>
          lastSelectionWithShift.has(dataKeyValue) &&
          newSelection.set(dataKeyValue, [...fields, selectedCol.field])
      );
      return newSelection;
    }

    const selectedColsMinIndex = Math.min(...shiftFieldsIndexes);

    const lastSelectionWithShiftIsLeftToLastCellClicked =
      lastColClickedIndex > selectedColsMinIndex;

    if (lastSelectionWithShiftIsLeftToLastCellClicked) {
      const col = columns[selectedColsMinIndex - 1];
      if (!col) {
        return currentSelection;
      }
      const newSelection = new Map(currentSelection);
      newSelection.forEach(
        (fields, dataKeyValue) =>
          lastSelectionWithShift.has(dataKeyValue) &&
          newSelection.set(dataKeyValue, [...fields, col.field])
      );
      return newSelection;
    } else {
      const selectedColsMaxIndex = Math.max(...shiftFieldsIndexes);
      const col = columns[selectedColsMaxIndex];
      if (!col) {
        return currentSelection;
      }
      const newSelection = new Map(currentSelection);
      newSelection.forEach(
        (fields, dataKeyValue) =>
          lastSelectionWithShift.has(dataKeyValue) &&
          newSelection.set(dataKeyValue, [
            ...fields.filter((field) => field != col.field),
          ])
      );
      return newSelection;
    }
  }
  //#endregion FROM ARROW LEFT WITH SHIFT

  //#region LAST SELECTION FROM CLICK WITH CTRL
  private lastSelectionFromClickWithCtrl$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = merge(this.table.click$, this._select).pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.ctrlKey),
    withLatestFrom(defer(() => this.selection$)),
    map(([{ row, col }, currentSelection]) =>
      this.isSelected(row, col, currentSelection)
        ? new Map()
        : new Map([[row.dataKeyValue, [col.field]]])
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM CLICK WITH CTRL

  //#region LAST SELECTION FROM CLICK WITH SHIFT
  private lastSelectionFromClickWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = merge(
    this.table.click$,
    this._select.pipe(
      withLatestFrom(this.table.rows$, this.table.footerRows$),
      map(([{ event, row, col }, rows, footerRows]) => ({
        event,
        row,
        col,
        fromFooter: row.fromFooter,
        rows,
        footerRows,
      }))
    )
  ).pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    withLatestFrom(
      defer(() => this.lastCellClickedDelayed$),
      this.table.orderedColumns$
    ),
    map(
      ([
        { row, col, fromFooter, rows, footerRows },
        lastCellClicked,
        { columns },
      ]) =>
        this.selectionFromClickWithShift(
          row,
          col,
          lastCellClicked,
          fromFooter ? footerRows : rows,
          columns
        )
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM CLICK WITH SHIFT

  //#region LAST SELECTION FROM ROW SELECTOR CLICK WITH SHIFT
  private lastSelectionFromRowSelectorClickWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.rowSelectorClick.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    withLatestFrom(
      defer(() => this.lastCellClickedDelayed$),
      this.table.rows$,
      this.table.orderedColumns$
    ),
    map(([{ row }, lastCellClicked, rows, { columns }]) =>
      this.selectionFromRowSelectorClickWithShift(
        row,
        lastCellClicked,
        rows,
        columns
      )
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM ROW SELECTOR CLICK WITH SHIFT

  //#region LAST SELECTION FROM ROW SELECTOR CLICK WITH CTRL
  private lastSelectionFromRowSelectorClickWithCtrl$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.rowSelectorClick.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.ctrlKey),
    withLatestFrom(
      defer(() => this.selection$),
      this.table.orderedColumns$
    ),
    map(([{ row }, currentSelection, { columns }]) =>
      columns.every((col) => this.isSelected(row, col, currentSelection))
        ? new Map()
        : new Map([[row.dataKeyValue, columns.map((col) => col.field)]])
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM ROW SELECTOR CLICK WITH CTRL

  //#region LAST SELECTION FROM COL SELECTOR CLICK WITH SHIFT
  private lastSelectionFromColSelectorClickWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.colSelectorClick.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    withLatestFrom(
      defer(() => this.lastCellClickedDelayed$),
      this.table.rows$,
      this.table.orderedColumns$
    ),
    map(([{ col }, lastCellClicked, rows, { columns }]) =>
      this.selectionFromColSelectorClickWithShift(
        col,
        lastCellClicked,
        rows,
        columns
      )
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM COL SELECTOR CLICK WITH SHIFT

  //#region LAST SELECTION FROM COL SELECTOR CLICK WITH CTRL
  private lastSelectionFromColSelectorClickWithCtrl$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.colSelectorClick.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.ctrlKey),
    withLatestFrom(
      defer(() => this.selection$),
      this.table.rows$,
      this.table.orderedColumns$
    ),
    map(([{ col }, currentSelection, rows, { columns }]) =>
      rows.every((row) => this.isSelected(row, col, currentSelection))
        ? new Map()
        : new Map(rows.map((row) => [row.dataKeyValue, [col.field]]))
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM COL SELECTOR CLICK WITH CTRL

  //#region LAST SELECTION FROM SPACE WITH SHIFT
  private lastSelectionFromSpaceWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onSpace$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() => this.lastSelectionWithShift$),
      defer(() => this.lastCellClickedDelayed$)
    ),
    map(
      ([
        { columns, rows, footerRows },
        lastSelectionWithShift,
        lastCellClicked,
      ]) =>
        this.selectionFromSpaceWithShift(
          lastSelectionWithShift,
          lastCellClicked,
          rows,
          footerRows,
          columns
        )
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM SPACE WITH SHIFT

  //#region LAST SELECTION FROM SPACE WITH CTRL
  private lastSelectionFromSpaceWithCtrl$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onSpace$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.ctrlKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() => this.lastSelectionWithShift$),
      defer(() => this.lastCellClickedDelayed$)
    ),
    map(
      ([
        { columns, rows, footerRows },
        lastSelectionWithShift,
        lastCellClicked,
      ]) =>
        this.selectionFromSpaceWithCtrl(
          lastSelectionWithShift,
          lastCellClicked,
          rows,
          footerRows,
          columns
        )
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM SPACE WITH CTRL

  //#region LAST SELECTION FROM ARROW UP WITH SHIFT
  private lastSelectionFromArrowUpWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowUp$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() => this.lastCellClickedDelayed$),
      defer(() => this.lastSelectionWithShift$)
    ),
    map(([{ rows, footerRows }, lastCellClicked, lastSelectionWithShift]) =>
      this.selectionFromArrowUpWithShift(
        lastCellClicked,
        lastSelectionWithShift,
        rows,
        footerRows,
        lastSelectionWithShift
      )
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM ARROW UP WITH SHIFT

  //#region LAST SELECTION FROM ARROW RIGHT WITH SHIFT
  private lastSelectionFromArrowRightWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowRight$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() => this.lastCellClickedDelayed$),
      defer(() => this.lastSelectionWithShift$)
    ),
    map(([{ columns }, lastCellClicked, lastSelectionWithShift]) =>
      this.selectionFromArrowRightWithShift(
        lastCellClicked,
        lastSelectionWithShift,
        columns,
        lastSelectionWithShift
      )
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM ARROW RIGHT WITH SHIFT

  //#region LAST SELECTION FROM ARROW DOWN WITH SHIFT
  private lastSelectionFromArrowDownWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowDown$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() => this.lastCellClickedDelayed$),
      defer(() => this.lastSelectionWithShift$)
    ),
    map(([{ rows, footerRows }, lastCellClicked, lastSelectionWithShift]) =>
      this.selectionFromArrowDownWithShift(
        lastCellClicked,
        lastSelectionWithShift,
        rows,
        footerRows,
        lastSelectionWithShift
      )
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM ARROW DOWN WITH SHIFT

  //#region LAST SELECTION FROM ARROW LEFT WITH SHIFT
  private lastSelectionFromArrowLeftWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = this.onArrowLeft$.pipe(
    this.ifNotReadonly(),
    this.ifMultipleMode(),
    filter(({ event }) => event.shiftKey),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(
      defer(() => this.lastCellClickedDelayed$),
      defer(() => this.lastSelectionWithShift$)
    ),
    map(([{ columns }, lastCellClicked, lastSelectionWithShift]) =>
      this.selectionFromArrowLeftWithShift(
        lastCellClicked,
        lastSelectionWithShift,
        columns,
        lastSelectionWithShift
      )
    ),
    startWith<_ImperiaTableV2CellInternalSelection<TItem>>(new Map()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion LAST SELECTION FROM ARROW LEFT WITH SHIFT

  //#region LAST CELL CLICKED
  public lastCellClicked$: Observable<{
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
  } | null> = merge(
    this.table.clicksComponent.pipe(
      startWith(null),
      pairwise(),
      filter(([prev, curr]) => !!prev !== !!curr),
      map(([prev, curr]) => curr),
      switchMap(
        (clicksComponent) => clicksComponent?.lastCellClicked$ ?? of(null)
      )
    ),
    this._select,
    this.lastCellClickedFromArrowUp$,
    this.lastCellClickedFromArrowRight$,
    this.lastCellClickedFromArrowDown$,
    this.lastCellClickedFromArrowLeft$,
    this.lastCellClickedFromRowSelectorClick$,
    this.lastCellClickedFromColSelectorClick$
  ).pipe(startWith(null), shareReplay({ bufferSize: 1, refCount: true }));

  public $lastCellClicked = toSignal(this.lastCellClicked$, {
    initialValue: null,
  });
  //#endregion LAST CELL CLICKED

  //#region LAST CELL CLICKED DELAYED
  private lastCellClickedDelayed$: Observable<{
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
  } | null> = merge(
    this.lastCellClicked$.pipe(take(1)),
    this.lastCellClicked$.pipe(skip(1), delay(0, asapScheduler))
  ).pipe(startWith(null), shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion LAST CELL CLICKED DELAYED

  //#region LAST SELECTION WITH SHIFT
  private lastSelectionWithShift$: Observable<
    _ImperiaTableV2CellInternalSelection<TItem>
  > = merge(
    this.selectionFromClick$,
    this.lastSelectionFromClickWithCtrl$,
    this.lastSelectionFromClickWithShift$,
    this.selectionFromContextMenu$,
    this.selectionFromRowSelectorClick$,
    this.lastSelectionFromRowSelectorClickWithShift$,
    this.lastSelectionFromRowSelectorClickWithCtrl$,
    this.selectionFromColSelectorClick$,
    this.lastSelectionFromColSelectorClickWithShift$,
    this.lastSelectionFromColSelectorClickWithCtrl$,
    this.lastSelectionFromSpaceWithShift$,
    this.lastSelectionFromSpaceWithCtrl$,
    merge(
      this.selectionFromArrowUp$.pipe(
        map((selection) => ({ selection, from: 'ArrowUp' as const }))
      ),
      this.selectionFromArrowRight$.pipe(
        map((selection) => ({ selection, from: 'ArrowRight' as const }))
      ),
      this.selectionFromArrowDown$.pipe(
        map((selection) => ({ selection, from: 'ArrowDown' as const }))
      ),
      this.selectionFromArrowLeft$.pipe(
        map((selection) => ({ selection, from: 'ArrowLeft' as const }))
      )
    ).pipe(
      withLatestFrom(
        this.table.lastCellClicked$,
        this.table.rows$,
        this.table.orderedColumns$,
        this.table.headHeightChange$,
        this.table.tableSizeChange$,
        this.table.footHeightChange$
      ),
      tap(
        ([
          { selection, from },
          lastCellClicked,
          rows,
          { frozenLeftColumns, columns, frozenRightColumns },
          headHeight,
          tableResizeEvent,
          footHeight,
        ]) =>
          this.keepLastCellClickedInView(
            from,
            lastCellClicked,
            rows,
            frozenLeftColumns.columns,
            columns,
            frozenRightColumns.columns,
            headHeight,
            tableResizeEvent,
            footHeight
          )
      ),
      map(([{ selection }]) => selection)
    ),
    merge(
      this.lastSelectionFromArrowUpWithShift$,
      this.lastSelectionFromArrowLeftWithShift$,
      this.lastSelectionFromArrowDownWithShift$,
      this.lastSelectionFromArrowRightWithShift$
    ).pipe(
      withLatestFrom(
        this.table.lastCellClicked$,
        this.table.rows$,
        this.table.footerRows$,
        this.table.orderedColumns$,
        this.table.headHeightChange$,
        this.table.tableSizeChange$,
        this.table.footHeightChange$
      ),
      tap(
        ([
          selection,
          lastCellClicked,
          rows,
          footerRows,
          { frozenLeftColumns, columns, frozenRightColumns },
          headHeight,
          tableResizeEvent,
          footHeight,
        ]) =>
          this.keepCellInView(
            selection,
            lastCellClicked,
            rows,
            footerRows,
            frozenLeftColumns.columns,
            columns,
            frozenRightColumns.columns,
            headHeight,
            tableResizeEvent,
            footHeight
          )
      ),
      map(([selection]) => selection)
    )
  ).pipe(startWith(new Map()), shareReplay({ bufferSize: 1, refCount: true }));

  private removePreviousSelectionWithShift(
    selection: _ImperiaTableV2CellInternalSelection<TItem>,
    lastSelectionWithShift: _ImperiaTableV2CellInternalSelection<TItem>
  ): void {
    lastSelectionWithShift.forEach((fields, dataKeyValue) => {
      const currentFields = selection.get(dataKeyValue);
      if (!currentFields) return;
      if (currentFields.length === 0) {
        selection.delete(dataKeyValue);
      } else {
        selection.set(
          dataKeyValue,
          currentFields.filter((field) => !fields.includes(field))
        );
      }
    });
  }
  //#endregion LAST SELECTION WITH SHIFT

  //#region CHANGE
  @Output('selectionChange') selectionChangeEmitter: EventEmitter<
    ImperiaTableV2CellSelection<TItem>
  > = new EventEmitter<ImperiaTableV2CellSelection<TItem>>();
  public selection$: Observable<_ImperiaTableV2CellInternalSelection<TItem>> =
    this.disabled.pipe(
      switchMap((disabled) =>
        disabled
          ? of<_ImperiaTableV2CellInternalSelection<TItem>>(new Map())
          : merge(
              this.selection,
              this.selectionFromValueChange$,
              this.selectionFromColumnsChange$,
              this.selectionFromClick$,
              this.selectionFromClickWithShift$,
              this.selectionFromClickWithCtrl$,
              this.selectionFromContextMenu$,
              this.selectionFromRowSelectorClick$,
              this.selectionFromRowSelectorClickWithShift$,
              this.selectionFromRowSelectorClickWithCtrl$,
              this.selectionFromColSelectorClick$,
              this.selectionFromColSelectorClickWithShift$,
              this.selectionFromColSelectorClickWithCtrl$,
              this.selectionFromSpaceWithShift$,
              this.selectionFromSpaceWithCtrl$,
              this.selectionFromArrowUp$,
              this.selectionFromArrowRight$,
              this.selectionFromArrowDown$,
              this.selectionFromArrowLeft$,
              this.selectionFromArrowUpWithShift$,
              this.selectionFromArrowLeftWithShift$,
              this.selectionFromArrowDownWithShift$,
              this.selectionFromArrowRightWithShift$
            )
              .pipe(
                startWith<_ImperiaTableV2CellInternalSelection<TItem>>(
                  new Map()
                ),
                pairwise(),
                filter(([prev, curr]) => curr !== prev),
                map(([prev, curr]) => curr)
              )
              .pipe(
                combineLatestWith(this.mode, this.table.lastCellClicked$),
                map(([selection, mode, lastCellClicked]) => {
                  if (selection.size === 0) return selection;
                  if (mode === 'multiple') return selection;
                  if (!lastCellClicked) return selection;
                  return new Map([
                    [
                      lastCellClicked.row.dataKeyValue,
                      [lastCellClicked.col.field],
                    ],
                  ]);
                }),
                withLatestFrom(
                  this.table.rows$,
                  this.table.footerRows$,
                  this.table.orderedColumns$
                ),
                tap(([selection, rows, footerRows, { columns }]) =>
                  this.selectionChangeEmitter.emit(
                    this.toExternalSelection(
                      selection,
                      rows,
                      footerRows,
                      columns
                    )
                  )
                ),
                map(([selection]) => selection),
                startWith<_ImperiaTableV2CellInternalSelection<TItem>>(
                  new Map()
                )
              )
      ),
      shareReplay({
        bufferSize: 1,
        refCount: true,
      })
    );
  //#endregion CHANGE

  //#region SELECTED CELLS COUNT
  public selectedCellsCount$: Observable<number> = this.selection$.pipe(
    map((selection) =>
      Array.from(selection.values()).reduce(
        (acc, fields) => acc + fields.length,
        0
      )
    ),
    startWith(0),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion SELECTED CELLS COUNT

  //#region ROWS COPY
  @ViewChild('tableToCopyCells')
  tableToCopyCells!: ElementRef<HTMLTableElement>;
  public onCopyCells = new Subject<{
    items:
      | { col: ImperiaTableColumn<TItem>; row: ImperiaTableRow<TItem> }
      | _ImperiaTableV2CellInternalSelection<TItem>;
    from: 'cell' | 'selection';
  }>();

  public onCopyCells$ = this.onCopyCells.pipe(
    map(({ from, items }) => ({
      from,
      items:
        items instanceof Map
          ? items
          : new Map([[items.row.dataKeyValue, [items.col.field]]]),
    })),
    withValueFrom(this.table.columns$),
    map(([{ items, from }, columns]) => ({
      items,
      from,
      columns,
    })),
    share()
  );

  public rowsToCopy$ = this.onCopyCells$.pipe(
    withLatestFrom(this.table.rows$, this.table.footerRows$),
    map(([{ items, from, columns }, rows, footerRows]) => {
      const dataKeyValuesSelected = Array.from(items.keys());
      const rowsSelectedIndexes = dataKeyValuesSelected.map((dataKeyValue) =>
        rows.findIndex((row) => row.dataKeyValue === dataKeyValue)
      );
      const firstRowSelectedIndex = Math.min(...rowsSelectedIndexes);
      const lastRowSelectedIndex = Math.max(...rowsSelectedIndexes);

      const footerRowsSelectedIndexes = dataKeyValuesSelected.map(
        (dataKeyValue) =>
          footerRows.findIndex((row) => row.dataKeyValue === dataKeyValue)
      );

      const firstFooterRowSelectedIndex = Math.min(
        ...footerRowsSelectedIndexes
      );
      const lastFooterRowSelectedIndex = Math.max(...footerRowsSelectedIndexes);

      return {
        items: [
          ...rows
            .slice(firstRowSelectedIndex, lastRowSelectedIndex + 1)
            .map((row) => row.data),
          ...footerRows
            .slice(firstFooterRowSelectedIndex, lastFooterRowSelectedIndex + 1)
            .map((row) => row.data),
        ],
        from,
        columns,
      };
    }),
    map(({ items, columns }) =>
      this.table.mapToRows(items, columns, false, false)
    ),
    share()
  );

  public rowToCopyRendered$ = this.rowsToCopy$.pipe(
    concatMap((rows) =>
      scheduled(rows, animationFrameScheduler).pipe(endWith(null))
    ),
    takeWhile((row) => row != null, true),
    share()
  );

  private rowToCopyCopied$ = this.rowToCopyRendered$.pipe(
    map(() => this.tableToCopyCells.nativeElement.querySelector('tr')),
    withLatestFrom(this.onCopyCells$, this.table.orderedColumns$),
    map(([row, { items }, { columns }]) => {
      const columnsFieldsSelected = Array.from(items.values()).flat();
      const columnsSelectedIndexes = columnsFieldsSelected.map((field) =>
        columns.findIndex((column) => column.field == field)
      );
      const firstColumnSelectedIndex = Math.min(...columnsSelectedIndexes);
      const lastColumnSelectedIndex = Math.max(...columnsSelectedIndexes);
      const allFields = columns
        .map(({ field }) => field)
        .slice(firstColumnSelectedIndex, lastColumnSelectedIndex + 1);
      return {
        row,
        allFields,
      };
    }),
    map(({ row, allFields }) => this.getCellsInnerText(row, allFields)),
    share()
  );

  private textToCopy$ = this.rowToCopyCopied$.pipe(
    filter((textToCopy): textToCopy is string => textToCopy != null),
    reduce((textToCopy, curr) => textToCopy + curr + '\n', ''),
    share()
  );

  private textCopied$ = this.textToCopy$.pipe(
    last(),
    switchMap((textToCopy) =>
      this.copyToClipboard(textToCopy).pipe(
        map((copied) => ({
          copied,
          textToCopy,
        }))
      )
    ),
    tap(
      ({ copied, textToCopy }) => !copied && this.generateCsvFile(textToCopy)
    ),
    share()
  );

  public copyingCells$: Observable<CopyingCellsVM> = merge(
    this.onCopyCells$.pipe(
      map(
        ({ from, items }) =>
          new CopyingCellsVM({
            state: true,
            from,
            totalCellsToCopy: Array.from(items.values()).reduce(
              (acc, fields) => acc + fields.length,
              0
            ),
          })
      )
    ),
    this.textCopied$.pipe(
      withLatestFrom(this.onCopyCells$),
      repeat(),
      map(
        ([{ copied }, { from }]) =>
          new CopyingCellsVM({
            from,
            result: copied,
          })
      )
    ),
    this.textCopied$.pipe(
      repeat(),
      debounceTime(500),
      map(() => new CopyingCellsVM())
    )
  ).pipe(
    startWith(new CopyingCellsVM()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public tableToCopyCellsVM$ = merge(
    this.onCopyCells$,
    this.textCopied$.pipe(
      repeat(),
      map(() => ({
        items: [],
        from: null,
        columns: [],
      }))
    )
  ).pipe(
    startWith({
      items: [],
      from: null,
      columns: [],
    })
  );

  private getCellsInnerText(
    row: HTMLTableRowElement | null,
    allFields: Extract<keyof TItem, string>[]
  ): string | null {
    if (!row) return null;

    return allFields
      .map(
        (field) =>
          row.querySelector(`td[data-field="${field}"]`) as HTMLTableCellElement
      )
      .map((td) => td.innerText.replace(/\n/g, '').replace(/\t/g, ''))
      .join('\t');
  }

  private copyToClipboard(textToCopy: string) {
    return new Observable<boolean>((subscriber) => {
      const pendingCopy = this.clipboard.beginCopy(textToCopy);
      const copyAttempts = Array.from({ length: 10 }).fill(null);
      const unsubscribe = () => {
        attemptCopy.unsubscribe();
        pendingCopy.destroy();
        subscriber.complete();
      };
      const attemptCopy = from(copyAttempts)
        .pipe(
          zipWith(interval(500)),
          takeWhile(([_, attempt]) => attempt < copyAttempts.length),
          map(() => pendingCopy.copy()),
          filter((copied) => copied),
          first(),
          catchError(() => of(false)),
          tap((copied) => subscriber.next(copied)),
          finalize(() => unsubscribe())
        )
        .subscribe();

      return unsubscribe;
    });
  }

  private generateCsvFile(textToCopy: string) {
    const csv = new Blob([textToCopy.replace(/\t/g, ';')], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(csv, 'selection.csv');
  }
  //#endregion ROWS COPY

  //#region TEMPLATES
  @ContentChildren(ImperiaTableV2CellSelectionTemplateDirective)
  set templatesSetter(
    v: QueryList<ImperiaTableV2CellSelectionTemplateDirective<TItem>>
  ) {
    this.templateDirectives.next(v);
  }
  private templateDirectives = new ReplaySubject<
    QueryList<ImperiaTableV2CellSelectionTemplateDirective<TItem>>
  >(1);
  private templatesDirectives$: Observable<
    ImperiaTableV2CellSelectionTemplateDirective<TItem>[]
  > = this.templateDirectives.pipe(
    first(),
    switchMap((templates) =>
      templates.changes.pipe(startWith(templates.toArray()))
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion TEMPLATES

  //#region CONTEXT MENU TEMPLATE
  public contextTemplate$ = this.templatesDirectives$.pipe(
    map((templatesDirectives) =>
      templatesDirectives.find(({ type }) => type === 'context-menu')
    ),
    map((templatesDirective) => templatesDirective?.template)
  );
  //#endregion CONTEXT MENU TEMPLATE

  //#region CONTENT TEMPLATE
  private templateToOpen = new Subject<string>();
  public openContentTemplate =
    (overlayContext: { withContent: boolean }) => (name: string) => {
      this.templateToOpen.next(name);
      overlayContext.withContent = true;
    };
  private contentTemplates$ = this.templatesDirectives$.pipe(
    map((templatesDirectives) =>
      templatesDirectives.filter(({ type }) => type === 'content')
    )
  );
  public defaultContentTemplate$ = this.templatesDirectives$.pipe(
    map((templatesDirectives) =>
      templatesDirectives.find(({ type }) => type === 'content')
    ),
    map((template) => template?.template)
  );
  public contentTemplate$ = combineLatest([
    this.contentTemplates$,
    this.templateToOpen,
  ]).pipe(
    map(([templates, templateToOpen]) =>
      templates.find(({ name }) => name === templateToOpen)
    ),
    map((template) => template?.template)
  );
  //#endregion CONTENT TEMPLATE

  //#region OVERLAY
  @Input() showOverlay: boolean = true;
  @ViewChild('overlay', { static: true })
  overlay!: TemplateRef<any>;
  private destroy = new Subject<void>();
  private embeddedViewRef$: Observable<EmbeddedViewRef<any> | null> =
    combineLatest([
      this.table.scrolling$.pipe(
        distinctUntilChanged(),
        tap(() => this.table.lastCellClickedContextMenuVcr?.clear())
      ),
      this.lastCellClicked$.pipe(
        tap(
          (lastCellClicked) =>
            !lastCellClicked &&
            this.table.lastCellClickedContextMenuVcr?.clear()
        )
      ),
      this.table.filtersTableContainerSizeChange$,
      this.contentTemplates$.pipe(
        tap(
          (contentTemplates) =>
            !contentTemplates.length &&
            this.table.lastCellClickedContextMenuVcr?.clear()
        )
      ),
    ])
      .pipe(
        filter(
          ([scrolling, lastCellClicked, _, contentTemplate]) =>
            !scrolling && !!lastCellClicked && !!contentTemplate.length
        ),
        map(([_, lastCellClicked, { DOMRect }]) => ({
          lastCellClicked,
          bounds: DOMRect,
        })),
        filter(
          (
            value
          ): value is {
            bounds: DOMRect;
            lastCellClicked: {
              col: ImperiaTableColumn<TItem>;
              row: ImperiaTableRow<TItem>;
            };
          } => !!value.lastCellClicked
        )
      )
      .pipe(
        map(({ bounds, lastCellClicked }) => ({
          bounds,
          lastCellClickedDOMRect: this.getLastCellClickedDOMRect(
            lastCellClicked.row,
            lastCellClicked.col
          ),
        })),
        filter(
          (
            value
          ): value is { bounds: DOMRect; lastCellClickedDOMRect: DOMRect } =>
            !!value.lastCellClickedDOMRect
        )
      )
      .pipe(
        map(({ bounds, lastCellClickedDOMRect }) => ({
          bounds,
          closestCornerToBoundsCenter: this.getClosestCornerToBoundsCenter(
            bounds,
            this.getCorners(lastCellClickedDOMRect)
          ),
        })),
        filter(
          (
            value
          ): value is {
            bounds: DOMRect;
            closestCornerToBoundsCenter: CellCorner;
          } => !!value.closestCornerToBoundsCenter
        )
      )
      .pipe(
        withLatestFrom(defer(() => this.embeddedViewRef$)),
        map(([{ bounds, closestCornerToBoundsCenter }, embeddedViewRef]) =>
          embeddedViewRef && !embeddedViewRef.destroyed
            ? this.updateContext(
                embeddedViewRef,
                closestCornerToBoundsCenter,
                bounds
              )
            : this.table.lastCellClickedContextMenuVcr.createEmbeddedView(
                this.overlay,
                {
                  $implicit: {
                    ...this.getPosition(closestCornerToBoundsCenter, bounds),
                    withContent: false,
                  },
                }
              )
        ),
        tap((embeddedViewRef) => embeddedViewRef.detectChanges()),
        startWith(null),
        finalize(() => this.table.lastCellClickedContextMenuVcr?.clear()),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        }),
        takeUntil(this.destroy)
      );
  //#endregion OVERLAY

  ngOnInit(): void {
    this.embeddedViewRef$.subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  private keepLastCellClickedInView(
    from: 'ArrowUp' | 'ArrowRight' | 'ArrowDown' | 'ArrowLeft',
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    } | null,
    rows: ImperiaTableRow<TItem>[],
    frozenLeftColumns: ImperiaTableColumn<TItem>[],
    columns: ImperiaTableColumn<TItem>[],
    frozenRightColumns: ImperiaTableColumn<TItem>[],
    headHeight: number,
    table: ImpResizeEvent,
    footHeight: number
  ) {
    if (!lastCellClicked) return;

    const lastCellClickedDOMRect = this.table
      .getCellElementRef(
        lastCellClicked.row.dataKeyValue,
        lastCellClicked.col.field
      )
      ?.getBoundingClientRect();

    const frozenLeftColumnsWidth = this.table.getWidthSum(frozenLeftColumns);
    const frozenRightColumnsWidth = this.table.getWidthSum(frozenRightColumns);

    const isLastCellClickedFullyVisibleVertically = lastCellClickedDOMRect
      ? lastCellClickedDOMRect.top >= table.DOMRect.top + headHeight + 32 &&
        lastCellClickedDOMRect.bottom <= table.DOMRect.bottom - footHeight - 32
      : false;

    const isLastCellClickedFullyVisibleHorizontally = lastCellClickedDOMRect
      ? lastCellClickedDOMRect.right <=
          table.DOMRect.right - frozenRightColumnsWidth - 32 &&
        lastCellClickedDOMRect.left >=
          table.DOMRect.left + frozenLeftColumnsWidth + 32
      : false;

    const lastRowClickedIndex = rows.findIndex(
      (row) => row.dataKeyValue == lastCellClicked.row.dataKeyValue
    );

    const lastColClickedIndex = columns.findIndex(
      (column) => column.field == lastCellClicked.col.field
    );

    if (!isLastCellClickedFullyVisibleVertically) {
      table.element.scrollTo({
        top:
          this.table.virtualScrollStrategy._scrollStrategy.offsetByIndex(
            Math.max(lastRowClickedIndex + (from === 'ArrowDown' ? 2 : -1), 0)
          ) -
          (from === 'ArrowDown'
            ? table.DOMRect.height - headHeight - footHeight
            : 0),
      });
    }

    if (!isLastCellClickedFullyVisibleHorizontally) {
      table.element.scrollTo({
        left:
          this.table.getWidthSum(
            columns.slice(
              0,
              Math.max(
                lastColClickedIndex + (from === 'ArrowRight' ? 2 : -1),
                0
              )
            )
          ) -
          frozenLeftColumnsWidth -
          (from === 'ArrowRight'
            ? table.DOMRect.width -
              frozenLeftColumnsWidth -
              frozenRightColumnsWidth
            : 0),
      });
    }
  }

  private keepCellInView(
    selection: _ImperiaTableV2CellInternalSelection<TItem>,
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    } | null,
    rows: ImperiaTableRow<TItem>[],
    footerRows: ImperiaTableRow<TItem>[],
    frozenLeftColumns: ImperiaTableColumn<TItem>[],
    columns: ImperiaTableColumn<TItem>[],
    frozenRightColumns: ImperiaTableColumn<TItem>[],
    headHeight: number,
    table: ImpResizeEvent,
    footHeight: number
  ) {
    if (!lastCellClicked) return;

    const {
      shiftColumnsIndexes,
      shiftRowsIndexes,
      lastColClickedIndex,
      lastRowClickedIndex,
      at,
    } = this.whereIsLastSelectionWithShiftFromLastCellClicked(
      selection,
      lastCellClicked,
      columns,
      rows,
      footerRows
    );

    let rowIndexOfTheCellToBeKeptVisible = lastRowClickedIndex;
    let columnIndexOfTheCellToBeKeptVisible = lastColClickedIndex;

    switch (at) {
      case 'top-right':
        rowIndexOfTheCellToBeKeptVisible = Math.min(...shiftRowsIndexes);
        columnIndexOfTheCellToBeKeptVisible = Math.max(...shiftColumnsIndexes);
        break;
      case 'bottom-right':
        rowIndexOfTheCellToBeKeptVisible = Math.max(...shiftRowsIndexes);
        columnIndexOfTheCellToBeKeptVisible = Math.max(...shiftColumnsIndexes);
        break;
      case 'bottom-left':
        rowIndexOfTheCellToBeKeptVisible = Math.max(...shiftRowsIndexes);
        columnIndexOfTheCellToBeKeptVisible = Math.min(...shiftColumnsIndexes);
        break;
      case 'top-left':
        rowIndexOfTheCellToBeKeptVisible = Math.min(...shiftRowsIndexes);
        columnIndexOfTheCellToBeKeptVisible = Math.min(...shiftColumnsIndexes);
        break;
      default:
        break;
    }

    const cellToKeepVisibleDOMRect = this.table
      .getCellElementRef(
        rows[rowIndexOfTheCellToBeKeptVisible].dataKeyValue,
        columns[columnIndexOfTheCellToBeKeptVisible].field
      )
      ?.getBoundingClientRect();

    const frozenLeftColumnsWidth = this.table.getWidthSum(frozenLeftColumns);
    const frozenRightColumnsWidth = this.table.getWidthSum(frozenRightColumns);

    const isCellToKeepVisibleFullyVisibleVertically = cellToKeepVisibleDOMRect
      ? cellToKeepVisibleDOMRect.top >= table.DOMRect.top + headHeight + 32 &&
        cellToKeepVisibleDOMRect.bottom <=
          table.DOMRect.bottom - footHeight - 32
      : false;

    const isCellToKeepVisibleFullyVisibleHorizontally = cellToKeepVisibleDOMRect
      ? cellToKeepVisibleDOMRect.right <=
          table.DOMRect.right - frozenRightColumnsWidth - 32 &&
        cellToKeepVisibleDOMRect.left >=
          table.DOMRect.left + frozenLeftColumnsWidth + 32
      : false;

    if (!isCellToKeepVisibleFullyVisibleVertically) {
      table.element.scrollTo({
        top:
          this.table.virtualScrollStrategy._scrollStrategy.offsetByIndex(
            Math.max(
              rowIndexOfTheCellToBeKeptVisible +
                (at.includes('bottom') ? 2 : -1),
              0
            )
          ) -
          (at.includes('bottom')
            ? table.DOMRect.height - headHeight - footHeight
            : 0),
      });
    }

    if (!isCellToKeepVisibleFullyVisibleHorizontally) {
      table.element.scrollTo({
        left:
          this.table.getWidthSum(
            columns.slice(
              0,
              Math.max(
                columnIndexOfTheCellToBeKeptVisible +
                  (at.includes('right') ? 2 : -1),
                0
              )
            )
          ) -
          frozenLeftColumnsWidth -
          (at.includes('right')
            ? table.DOMRect.width -
              frozenLeftColumnsWidth -
              frozenRightColumnsWidth
            : 0),
      });
    }
  }

  private whereIsLastSelectionWithShiftFromLastCellClicked(
    lastSelectionWithShift: _ImperiaTableV2CellInternalSelection<TItem>,
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    },
    columns: ImperiaTableColumn<TItem>[],
    rows: ImperiaTableRow<TItem>[],
    footerRows: ImperiaTableRow<TItem>[]
  ): {
    shiftColumnsIndexes: number[];
    shiftRowsIndexes: number[];
    lastColClickedIndex: number;
    lastRowClickedIndex: number;
    at: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  } {
    const rowsOrFooterRows = lastCellClicked.row.fromFooter ? footerRows : rows;

    const shiftColumnsFields = Array.from(
      lastSelectionWithShift.values()
    )[0] ?? [lastCellClicked.col.field];

    const shiftColumnsIndexes = shiftColumnsFields.map((field) =>
      columns.findIndex((column) => column.field == field)
    );

    const shiftColumnsMinIndex = Math.min(...shiftColumnsIndexes);

    const shiftRowsDataKeyValues = Array.from(lastSelectionWithShift.keys());

    const shiftRowsIndexes = shiftRowsDataKeyValues.map((dataKeyValue) =>
      rowsOrFooterRows.findIndex((row) => row.dataKeyValue == dataKeyValue)
    );

    const shiftRowsMinIndex = Math.min(...shiftRowsIndexes);

    const lastColClickedIndex = columns.findIndex(
      (column) => column.field == lastCellClicked.col.field
    );

    const lastRowClickedIndex = rowsOrFooterRows.findIndex(
      (row) => row.dataKeyValue == lastCellClicked.row.dataKeyValue
    );

    return {
      shiftColumnsIndexes,
      shiftRowsIndexes,
      lastColClickedIndex,
      lastRowClickedIndex,
      at: `${lastRowClickedIndex > shiftRowsMinIndex ? 'top' : 'bottom'}-${
        lastColClickedIndex > shiftColumnsMinIndex ? 'left' : 'right'
      }` as const,
    };
  }

  private toExternalSelection(
    selection: _ImperiaTableV2CellInternalSelection<TItem>,
    rows: ImperiaTableRow<TItem>[],
    footerRows: ImperiaTableRow<TItem>[],
    columns: ImperiaTableColumn<TItem>[]
  ): ImperiaTableV2CellSelection<TItem> {
    return Array.from(selection)
      .map(([dataKeyValue, fields]) => {
        const row =
          rows.find((row) => row.dataKeyValue === dataKeyValue) ??
          footerRows.find((row) => row.dataKeyValue === dataKeyValue);
        if (!row) return null;
        return {
          row,
          cells: columns
            .filter((column) => fields.includes(column.field))
            .map((col) => ({
              col,
              state: (state: httpRequestState) =>
                row.cells[col.field].setState(state, row),
              set: (data: Partial<TItem>) => {
                Object.assign(row.data, data);
                //Se actualiza el valor de la celda
                row.cells[col.field].value = data[col.field] as any;
                //Se actualiza el valor del control
                row.cells[col.field].control.setValue(
                  row.cells[col.field].value,
                  {
                    emitEvent: false,
                  }
                );
                //Se actualiza el contexto del template
                row.cells[col.field].templateContext = {
                  $implicit: {
                    col: col,
                    row: row,
                    colIndex: columns.indexOf(col),
                    rowIndex: row.index,
                  },
                };
                //Se emite el evento de renderizado de la fila
                this.table.onRowRenderEmitter.emit(row);
              },
              render: () => {
                this.table.onRowRenderEmitter.emit(row);
              },
            })),
          fromFooter: row.fromFooter,
        };
      })
      .filter(isTruthy);
  }

  private getLastCellClickedDOMRect(
    row: ImperiaTableRow<TItem>,
    col: ImperiaTableColumn<TItem>
  ) {
    return this.table
      .getCellElementRef(row.dataKeyValue, col.field)
      ?.getBoundingClientRect();
  }

  private getCorners(
    DOMRect?: DOMRect
  ):
    | [
        CellCorner<'top-left'>,
        CellCorner<'top-right'>,
        CellCorner<'bottom-left'>,
        CellCorner<'bottom-right'>
      ]
    | null {
    if (!DOMRect) return null;
    const { top, left, bottom, right } = DOMRect;

    return [
      { name: 'top-left', y: top, x: left },
      { name: 'top-right', y: top, x: right },
      { name: 'bottom-left', y: bottom, x: left },
      { name: 'bottom-right', y: bottom, x: right },
    ];
  }

  private getClosestCornerToBoundsCenter(
    bounds: DOMRect,
    corners?:
      | [
          CellCorner<'top-left'>,
          CellCorner<'top-right'>,
          CellCorner<'bottom-left'>,
          CellCorner<'bottom-right'>
        ]
      | null
  ) {
    return (
      corners?.reduce<{
        distance: number;
        corner: CellCorner;
      }>(
        (acc, curr) => {
          const distance = Math.sqrt(
            Math.pow(bounds.left + bounds.width / 2 - curr.x, 2) +
              Math.pow(bounds.top + bounds.height / 2 - curr.y, 2)
          );
          return distance < acc.distance ? { distance, corner: curr } : acc;
        },
        { distance: Infinity, corner: corners[0] }
      ).corner ?? null
    );
  }

  private updateContext(
    embeddedViewRef: EmbeddedViewRef<any>,
    closestCornerToBoundsCenter: CellCorner,
    bounds: DOMRect
  ) {
    embeddedViewRef.context.$implicit = {
      ...embeddedViewRef.context.$implicit,
      ...this.getPosition(closestCornerToBoundsCenter, bounds),
      withContent: false,
    };
    return embeddedViewRef;
  }

  private getPosition(corner: CellCorner, bounds: DOMRect) {
    const top = corner.y - bounds.top;
    const left = corner.x - bounds.left;
    const bottom = bounds.bottom - corner.y;
    const right = bounds.right - corner.x;

    const atTop = corner.name.includes('top');
    const atRight = corner.name.includes('right');

    return {
      name: corner.name,
      top: atTop ? top : null,
      left: atRight ? left : null,
      bottom: atTop ? null : bottom,
      right: atRight ? null : right,
      maxHeight: atTop ? bounds.height - bottom : bounds.height - top,
      maxWidth: atRight ? bounds.width - left : bounds.width - right,
    };
  }
}
