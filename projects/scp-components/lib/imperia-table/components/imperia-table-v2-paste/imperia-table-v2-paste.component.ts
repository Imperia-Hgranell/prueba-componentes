import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { httpRequestState } from '@imperiascm/rxjs-utils';
import { ImperiaTableV2Component } from '../imperia-table-v2/imperia-table-v2.component';
import { ImperiaTableColumn } from '../../models/imperia-table-columns.models';
import { ImperiaTableRow } from '../../models/imperia-table-rows.models';
import { ImpOverlayService } from '@imperiascm/scp-utils/overlay';
import { LOCALE } from '@imperiascm/scp-utils/functions';
import {
  combineLatest,
  endWith,
  filter,
  from,
  fromEvent,
  map,
  Observable,
  of,
  share,
  shareReplay,
  skip,
  startWith,
  switchMap,
  take,
  takeWhile,
  withLatestFrom,
} from 'rxjs';
import { ImpTranslateService } from '@imperiascm/translate';

export interface ImperiaTableV2PastedRowData<TItem extends object> {
  row: ImperiaTableRow<TItem>;
  cells: {
    col: ImperiaTableColumn<TItem>;
    current: TItem[Extract<keyof TItem, string>];
    pasted: string | number;
    state: (state: httpRequestState) => void;
    set: (data: Partial<TItem>) => void;
  }[];
}

export interface ImperiaTableV2PasteEvent<TItem extends object> {
  event: ClipboardEvent;
  rows: ImperiaTableV2PastedRowData<TItem>[];
  count: number;
  fromFooter: boolean;
  fromRowTotal: boolean;
}

@Component({
  selector: 'imperia-table-v2-paste',
  templateUrl: './imperia-table-v2-paste.component.html',
  styleUrls: ['./imperia-table-v2-paste.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV2PasteComponent<TItem extends object> {
  private readonly LOCALE = LOCALE();
  public readonly TRANSLATION =
    this.typedTranslateService.translation.IMPERIA_TABLE_V2_PASTE;

  @ViewChild('confirmationTemplate') confirmationTemplate!: TemplateRef<{
    $implicit: {
      data: ImperiaTableV2PastedRowData<TItem>[];
    };
  }>;

  //#region INPUT CHECKS
  @Input('checkIfSomeCellIsNotEditable') checkIfSomeCellIsNotEditable = true;
  @Input('checkIfNotANumberAtData') checkIfNotANumberAtData = true;
  @Input('allowNegativeNumbers') allowNegativeNumbers = false;
  //#endregion INPUT CHECKS

  //#region DATA
  public data$ = fromEvent<ClipboardEvent>(document, 'paste')
    .pipe(
      this.ifTableIsFocused(),
      this.ifTableIsNotInEditMode(),
      this.extractDataFromClipboard(),
      this.convertToTableData()
    )
    .pipe(
      filter(({ data }) => {
        const notANumberAtData =
          this.checkIfNotANumberAtData && this.alertIfNotANumberAtData(data);
        if (notANumberAtData) {
          return false;
        }

        const negativeNumbersAtData =
          !this.allowNegativeNumbers && this.alertIfNegativeNumbersAtData(data);
        if (negativeNumbersAtData) {
          return false;
        }

        return true;
      }),
      withLatestFrom(
        this.table.lastCellClicked$.pipe(filter(Boolean)),
        this.table.rows$,
        this.table.footerRows$,
        this.table.orderedColumns$
      ),
      filter(([{ data }, lastCellClicked, rows, footerRows, { columns }]) =>
        this.alertIfDataRowsOverflow(data, lastCellClicked, rows, footerRows)
      ),
      filter(([{ data }, lastCellClicked, rows, footerRows, { columns }]) =>
        this.alertIfDataColumnsOverflow(data, lastCellClicked, columns)
      ),
      map(
        ([
          { event, data },
          lastCellClicked,
          rows,
          footerRows,
          { columns },
        ]) => ({
          event,
          rows: this.matchDataToTable(
            data,
            lastCellClicked,
            rows,
            footerRows,
            columns
          ),
        })
      ),
      map(({ event, rows }) => ({
        event,
        rows,
        count: rows.reduce((acc, { cells }) => acc + cells.length, 0),
      })),
      shareReplay({
        bufferSize: 1,
        refCount: true,
      })
    );
  //#endregion DATA

  //#region SOME CELL IS NOT EDITABLE
  public someCellIsNotEditable$ = this.data$.pipe(
    map(({ rows }) => this.someCellIsNotEditable(rows))
  );
  //#endregion SOME CELL IS NOT EDITABLE

  //#region FROM FOOTER
  @Input('fromFooterFn') fromFooterFn: (
    event: Omit<ImperiaTableV2PasteEvent<TItem>, 'fromFooter' | 'fromRowTotal'>
  ) => boolean = (event) => {
    const hasFooterCells = event.rows.some(({ row }) => row.fromFooter);
    return hasFooterCells;
  };
  //#endregion FROM FOOTER

  //#region FROM ROW TOTAL
  @Input('fromRowTotalFn') fromRowTotalFn: (
    event: Omit<ImperiaTableV2PasteEvent<TItem>, 'fromFooter' | 'fromRowTotal'>
  ) => boolean = (event) => {
    const hasTotalBodyCells = event.rows.some(
      ({ row, cells }) =>
        !row.fromFooter && cells.some(({ col }) => col.field === 'Total')
    );
    const hasTotalFooterCells = event.rows.some(
      ({ row, cells }) =>
        row.fromFooter && cells.some(({ col }) => col.field === 'Total')
    );
    return hasTotalBodyCells || hasTotalFooterCells;
  };
  //#endregion FROM ROW TOTAL

  //#region EXTERNAL CONFIRMATION
  @Input('confirmations') externalConfirmationsFn: (
    event: ImperiaTableV2PasteEvent<TItem>
  ) => boolean | Observable<boolean> | Promise<boolean> = () => true;
  //#endregion EXTERNAL CONFIRMATION

  //#region ON PASTE
  @Output('onPaste') public onPaste$: Observable<
    ImperiaTableV2PasteEvent<TItem>
  > = this.data$.pipe(
    map((value) => ({
      ...value,
      fromFooter: this.fromFooterFn(value),
      fromRowTotal: this.fromRowTotalFn(value),
    })),
    this.confirmationWithPreview(),
    this.stopIfSomeCellIsNotEditable(),
    this.totalConfirmation(),
    this.externalConfirmations(),
    share()
  );
  //#endregion ON PASTE

  //#region PASTING
  @Output('pasting') public pasting$ = this.onPaste$.pipe(
    switchMap(({ rows, count }) =>
      combineLatest(
        rows.map(({ row, cells }) =>
          combineLatest(
            cells.map(({ col }) =>
              row.cells[col.field].state$.pipe(
                skip(1),
                filter(({ loading }) => !loading),
                startWith<Partial<httpRequestState>>({ loading: true })
              )
            )
          )
        )
      ).pipe(
        map((states) => states.flat()),
        map((states) => ({
          current: states.filter(({ loading }) => !loading).length,
          count,
        })),
        endWith({ current: count, count }),
        takeWhile(({ current, count }) => current < count, true)
      )
    ),
    share()
  );
  //#endregion PASTING

  //#region ON PASTE END
  @Output('onPasteEnd') public onPasteEnd$: Observable<
    ImperiaTableV2PasteEvent<TItem>
  > = this.onPaste$.pipe(
    switchMap((event) =>
      combineLatest(
        event.rows.map(({ row, cells }) =>
          combineLatest(
            cells.map(({ col }) =>
              row.cells[col.field].state$.pipe(
                skip(1),
                filter(({ loading }) => !loading),
                startWith<Partial<httpRequestState>>({ loading: true })
              )
            )
          )
        )
      ).pipe(
        map((states) => states.flat()),
        filter((states) => !states.some(({ loading }) => !!loading)),
        take(1),
        map(() => event)
      )
    )
  );
  //#endregion ON PASTE END

  constructor(
    private table: ImperiaTableV2Component<TItem>,
    private typedTranslateService: ImpTranslateService,
    private overlayService: ImpOverlayService
  ) {}

  private ifTableIsFocused<T>() {
    return (source$: Observable<T>) =>
      source$.pipe(
        withLatestFrom(this.table.isFocused$),
        filter(([, isFocused]) => isFocused),
        map(([value]) => value)
      );
  }

  private ifTableIsNotInEditMode<T>() {
    return (source$: Observable<T>) =>
      source$.pipe(
        withLatestFrom(this.table.editMode$),
        filter(([, editMode]) => !editMode),
        map(([value]) => value)
      );
  }

  private extractDataFromClipboard() {
    return (source$: Observable<ClipboardEvent>) =>
      source$.pipe(
        map((event) => ({ event, data: event.clipboardData?.getData('text') })),
        filter(
          (value): value is { event: ClipboardEvent; data: string } =>
            typeof value.data === 'string'
        )
      );
  }

  private convertToTableData() {
    return (source$: Observable<{ event: ClipboardEvent; data: string }>) =>
      source$.pipe(
        map(({ event, data }) => ({
          event,
          data: data.substring(0, data.lastIndexOf('\r\n')),
        })),
        map(({ event, data }) => ({ event, data: data.split('\r\n') })),
        map(({ event, data }) => ({
          event,
          data: data.map((row) => row.split('\t')),
        })),
        map(({ event, data }) => ({
          event,
          data: data
            .filter((row) => row.length > 0)
            .map((row) =>
              row.map((cell) =>
                this.asNumber(cell, this.checkIfNotANumberAtData)
              )
            ),
        }))
      );
  }

  private asNumber(value: string | null, withNan: boolean): string | number {
    if (value === null) return withNan ? NaN : '';
    const [thousandsSeparator, decimalSeparator] =
      this.LOCALE === 'es-ES' ? ['.', ','] : [',', '.'];
    const [integer, decimal] = value.split(decimalSeparator);
    const number = Number(
      `${integer.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '')}${
        decimal ? `.${decimal}` : ''
      }`
    );
    if (isNaN(number)) return withNan ? NaN : value;
    return number;
  }

  private alertIfNotANumberAtData(data: (string | number)[][]) {
    const notANumberAtData = data.some((row) =>
      row.some((cell) => (typeof cell === 'number' ? isNaN(cell) : false))
    );
    if (notANumberAtData) {
      this.overlayService.alert(
        this.TRANSLATION.errorMessages.NotANumberAtData
      );
    }
    return notANumberAtData;
  }

  private alertIfNegativeNumbersAtData(data: (string | number)[][]) {
    const negativeNumbersAtData = data.some((row) =>
      row.some((cell) => (typeof cell === 'number' ? cell < 0 : false))
    );
    if (negativeNumbersAtData) {
      this.overlayService.alert(
        this.TRANSLATION.errorMessages.NegativeNumbersAtData
      );
    }
    return negativeNumbersAtData;
  }

  private alertIfDataRowsOverflow(
    data: (string | number)[][],
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    },
    rows: ImperiaTableRow<TItem>[],
    footerRows: ImperiaTableRow<TItem>[]
  ) {
    const moreRowsThanTable =
      data.length >
      (lastCellClicked.row.fromFooter ? footerRows.length : rows.length) -
        lastCellClicked.row.index;
    if (moreRowsThanTable) {
      this.overlayService.alert(
        this.TRANSLATION.errorMessages.DataRowsOverflow
      );
    }
    return !moreRowsThanTable;
  }

  private alertIfDataColumnsOverflow(
    data: (string | number)[][],
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    },
    columns: ImperiaTableColumn<TItem>[]
  ) {
    const lastCellClickedColIndex = columns.findIndex(
      (col) => col === lastCellClicked.col
    );

    const moreColumnsThanTable = data.some(
      (row) => row.length > columns.length - lastCellClickedColIndex
    );
    if (moreColumnsThanTable) {
      this.overlayService.alert(
        this.TRANSLATION.errorMessages.DataColumnsOverflow
      );
    }
    return !moreColumnsThanTable;
  }

  private someCellIsNotEditable(data: ImperiaTableV2PastedRowData<any>[]) {
    return data.some(
      ({ row, cells }) =>
        row.editable === false ||
        cells.some(({ col }) => col.dataInfo.readonly === true)
    );
  }

  private matchDataToTable(
    pastedValues: (string | number)[][],
    lastCellClicked: {
      row: ImperiaTableRow<TItem>;
      col: ImperiaTableColumn<TItem>;
    },
    rows: ImperiaTableRow<TItem>[],
    footerRows: ImperiaTableRow<TItem>[],
    columns: ImperiaTableColumn<TItem>[]
  ): ImperiaTableV2PastedRowData<TItem>[] {
    const lastCellClickedRowIndex = lastCellClicked.row.index;
    const lastCellClickedColIndex = columns.findIndex(
      (col) => col === lastCellClicked.col
    );

    const _rows = (lastCellClicked.row.fromFooter ? footerRows : rows).slice(
      lastCellClickedRowIndex
    );
    const _columns = columns.slice(lastCellClickedColIndex);

    const matchedData = pastedValues.map((rowValues, rowIndex) => {
      const row = _rows[rowIndex];
      return {
        row,
        cells: rowValues.map((cellValues, colIndex) => {
          const col = _columns[colIndex];
          return {
            col,
            current: row.data[col.field],
            pasted: cellValues,
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
          };
        }),
      };
    });

    return matchedData;
  }

  private stopIfSomeCellIsNotEditable() {
    return (source$: Observable<ImperiaTableV2PasteEvent<TItem>>) =>
      source$.pipe(
        filter((value) => {
          if (
            this.checkIfSomeCellIsNotEditable &&
            this.someCellIsNotEditable(value.rows)
          ) {
            this.overlayService.alert(
              this.TRANSLATION.errorMessages.SomeCellNotEditable
            );
            return false;
          }
          return true;
        })
      );
  }

  private confirmationWithPreview() {
    return (source$: Observable<ImperiaTableV2PasteEvent<TItem>>) =>
      source$.pipe(
        switchMap((value) =>
          from(
            this.overlayService.confirm(this.confirmationTemplate, {
              width: '40%',
            })
          ).pipe(
            filter(Boolean),
            map(() => value)
          )
        )
      );
  }

  private totalConfirmation() {
    return (source$: Observable<ImperiaTableV2PasteEvent<TItem>>) =>
      source$.pipe(
        switchMap((value) =>
          value.fromFooter || value.fromRowTotal
            ? from(
                this.overlayService.confirm(
                  this.TRANSLATION.totalConfirmationMessage
                )
              ).pipe(
                filter(Boolean),
                map(() => value)
              )
            : of(value)
        )
      );
  }

  private externalConfirmations() {
    return (source$: Observable<ImperiaTableV2PasteEvent<TItem>>) =>
      source$.pipe(
        switchMap((value) =>
          this.toObservable(this.externalConfirmationsFn(value)).pipe(
            filter(Boolean),
            map(() => value)
          )
        )
      );
  }

  private toObservable<T>(
    value: T | Observable<T> | Promise<T>
  ): Observable<T> {
    return value instanceof Observable
      ? value
      : value instanceof Promise
      ? from(value)
      : of(value);
  }
}
