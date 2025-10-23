import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { markCellAs } from '../directives/editable-cell.functions';
import { ImperiaTableCell } from './imperia-table-cells.models';
import { ImperiaTableColumn } from './imperia-table-columns.models';
import { TImperiaTableColumnField } from './imperia-table-columns.types';
import { TImperiaTableRowStyle } from './imperia-table-rows.types';
import { createHash } from '@imperiascm/scp-utils/functions';
import { BehaviorSubject, Observable, combineLatestWith, map } from 'rxjs';

export class ImperiaTableDataSource<
  TRow extends object
> extends DataSource<TRow> {
  private _viewPort!: CdkVirtualScrollViewport;

  public dataStream = new BehaviorSubject<TRow[]>(this.rows);

  constructor(private rows: TRow[]) {
    super();
  }

  attach(viewPort: CdkVirtualScrollViewport) {
    if (!viewPort) {
      console.error('ViewPort is undefined');
      return;
    }
    this._viewPort = viewPort;
    this._viewPort.attach(this as any);
  }

  connect(collectionViewer: CollectionViewer): Observable<readonly TRow[]> {
    return this.dataStream.pipe(
      combineLatestWith(collectionViewer.viewChange),
      map(([rows, { start, end }]) => rows.slice(start, end))
    );
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.dataStream.complete();
  }

  updateRows(rows: TRow[]) {
    this.rows = rows;
    this.dataStream.next(rows);
  }
}

export class ImperiaTableRow<TItem extends object> {
  class: string;
  cells: Record<
    TImperiaTableColumnField<TItem>,
    ImperiaTableCell<TItem, TImperiaTableColumnField<TItem>>
  >;

  height!: number;
  isLastRowInRowspan = false;
  visible = true;

  private _editable = new BehaviorSubject<boolean>(true);
  public set editable(v: boolean) {
    this._editable.next(v);
  }
  public get editable() {
    return this._editable.value;
  }
  public editable$: Observable<boolean> = this._editable.asObservable();

  get dataKeyValue() {
    return Array.isArray(this.dataKey)
      ? createHash(this.dataKey.map((key) => this.data[key]).join(':'))
      : this.data[this.dataKey];
  }

  constructor(
    public index: number,
    public dataKey:
      | TImperiaTableColumnField<TItem>
      | TImperiaTableColumnField<TItem>[],
    public data: TItem,
    public columns: ImperiaTableColumn<TItem>[],
    public fromFooter: boolean,
    public style: TImperiaTableRowStyle = {},
    klass: string = '',
    editable: boolean = true
  ) {
    this.class = klass ?? '';
    this.style = style ?? {};
    this.cells = columns.reduce((cells, col, colIndex) => {
      cells[col.field] = new ImperiaTableCell(
        col.field,
        data[col.field],
        {
          $implicit: {
            row: this,
            rowIndex: index,
            col,
            colIndex,
          },
        },
        col.dataInfo,
        col.dataInfo.formValidations
      );
      return cells;
    }, {} as Record<TImperiaTableColumnField<TItem>, ImperiaTableCell<TItem, TImperiaTableColumnField<TItem>>>);
    this.editable = !!editable;
  }

  public markAs(as: 'loading' | 'ok' | 'error' | 'none') {
    Object.values(this.cells)
      .filter(
        (cell): cell is ImperiaTableCell<TItem> =>
          cell instanceof ImperiaTableCell
      )
      .forEach((cell) => markCellAs(as, cell.elementRef));
  }
}
