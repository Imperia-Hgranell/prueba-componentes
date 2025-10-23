import { ElementRef } from '@angular/core';
import { ImperiaTableCell } from '../models/imperia-table-cells.models';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { ImperiaTableCellEditEvent } from '../models/imperia-table-editing.models';
import { FOOTER_ROW_INDEX } from '../models/imperia-table-footer.constants';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';
import { fieldToImperiaTableColumnClass } from '../pipes/field-to-selectable-class.pipe';
import { roundTo } from '@imperiascm/scp-utils/functions';
import { fromEvent, map, Observable, take, takeUntil } from 'rxjs';

export type KeyFunctionParams<TItem extends object> = {
  input: HTMLInputElement;
  cell: ImperiaTableCell<TItem>;
  cellElement: ElementRef<HTMLDivElement>;
  hasBeenClicked: boolean;
} & ImperiaTableCellEditEvent<TItem>;

export type TKeysFunctions<TItem extends object> = {
  Enter: (cell: ImperiaTableCell<TItem>) => void;
  ArrowUp: (cell: ImperiaTableCell<TItem>) => void;
  ArrowDown: (cell: ImperiaTableCell<TItem>) => void;
  ArrowLeft: (cell: ImperiaTableCell<TItem>) => void;
  ArrowRight: (cell: ImperiaTableCell<TItem>) => void;
  Escape: (cell: ImperiaTableCell<TItem>) => void;
};

export type TSelectKeysFunctions<TItem extends object> = {
  Enter: (cell: ImperiaTableCell<TItem>) => void;
  ArrowLeft: (cell: ImperiaTableCell<TItem>) => void;
  ArrowRight: (cell: ImperiaTableCell<TItem>) => void;
  Escape: (cell: ImperiaTableCell<TItem>) => void;
};

//#region KEY FUNCTIONS
export const KEYS_FUNCTIONS = {
  Enter: Enter,
  ArrowUp: ArrowUp,
  ArrowDown: ArrowDown,
  ArrowLeft: ArrowLeft,
  ArrowRight: ArrowRight,
  Escape: Escape,
} as const;

export const SELECT_KEYS_FUNCTIONS = {
  Enter: Enter,
  ArrowLeft: ArrowLeft,
  ArrowRight: ArrowRight,
  Escape: Escape,
} as const;

export function isArrowKey(key: string) {
  return key.includes('Arrow');
}

export function Enter<TItem extends object>({
  input,
  cellElement,
  col,
}: KeyFunctionParams<TItem>): boolean {
  input.blur();
  //Guardamos la celda de la fila siguiente que corresponde a la misma columna
  const nextCdkRowCell =
    getCdkRowCell(getRow(cellElement, 'next'), col) ??
    getRowCell(getRow(cellElement, 'next'), col);

  if (!nextCdkRowCell) return false;
  //Si existe la celda siguiente
  if (!hasEditableClass(nextCdkRowCell)) return false;
  //Es editable
  if (isFooterCell(nextCdkRowCell)) return false;
  //Y no es el footer

  //Hacemos click en la celda siguiente
  (nextCdkRowCell as HTMLElement).click();
  return true;
}

export function ArrowUp<TItem extends object>({
  cellElement,
  col,
  rowIndex,
  input,
  hasBeenClicked,
}: KeyFunctionParams<TItem>): boolean {
  if (hasBeenClicked) {
    input.setSelectionRange(0, 0);
    return false;
  }
  if (rowIndex == FOOTER_ROW_INDEX) return false;
  //Guardamos la celda de la fila anterior que corresponde a la misma columna
  const previousCdkRowCell =
    getCdkRowCell(getRow(cellElement, 'previous'), col) ??
    getRowCell(getRow(cellElement, 'previous'), col);

  if (!previousCdkRowCell) return false;
  //Si existe la celda anterior
  if (!hasEditableClass(previousCdkRowCell)) return false;
  //Y es editable

  //Hacemos click en la celda anterior
  (previousCdkRowCell as HTMLElement).click();
  return true;
}

export function ArrowDown<TItem extends object>({
  cellElement,
  col,
  rowIndex,
  input,
  hasBeenClicked,
}: KeyFunctionParams<TItem>): boolean {
  if (hasBeenClicked) {
    input.setSelectionRange(input.value.length, input.value.length);
    return false;
  }
  if (rowIndex == FOOTER_ROW_INDEX) return false;
  //Guardamos la celda de la fila siguiente que corresponde a la misma columna
  const nextCdkRowCell =
    getCdkRowCell(getRow(cellElement, 'next'), col) ??
    getRowCell(getRow(cellElement, 'next'), col);

  if (!nextCdkRowCell) return false;
  //Si existe la celda siguiente
  if (!hasEditableClass(nextCdkRowCell)) return false;
  //Es editable
  if (isFooterCell(nextCdkRowCell)) return false;
  //Y no es el footer

  //Hacemos click en la celda siguiente
  (nextCdkRowCell as HTMLElement).click();
  return true;
}

export function ArrowLeft<TItem extends object>({
  cellElement,
  hasBeenClicked,
}: KeyFunctionParams<TItem>): boolean {
  if (hasBeenClicked) return false;
  //Buscamos la celda anterior a la que estamos editando
  const previousCdkCell = getCell(cellElement, 'previous');

  if (!previousCdkCell) return false;
  //Si existe la celda anterior
  if (!hasEditableClass(previousCdkCell)) return false;
  //Y es editable

  //Hacemos click en la celda anterior
  (previousCdkCell as HTMLElement).click();
  return true;
}

export function ArrowRight<TItem extends object>({
  cellElement,
  hasBeenClicked,
}: KeyFunctionParams<TItem>): boolean {
  if (hasBeenClicked) return false;
  //Buscamos la celda siguiente a la que estamos editando
  const nextCdkCell = getCell(cellElement, 'next');
  if (!nextCdkCell) return false;
  //Si existe la celda siguiente
  if (!hasEditableClass(nextCdkCell)) return false;
  //Y es editable
  //Hacemos click en la celda siguiente
  (nextCdkCell as HTMLElement).click();
  return true;
}

export function Escape<TItem extends object>({
  input,
  cell,
  cellElement,
  col,
  row,
  colIndex,
  rowIndex,
}: KeyFunctionParams<TItem>) {
  markCellAs('none', cellElement);
  cell.control.setValue(row.data[col.field]);
  row.cells[col.field].value = row.data[col.field];
  cell.control.markAsPristine();
  setCellTemplateContext('reset', {
    col,
    colIndex,
    row,
    rowIndex,
  });
  setTimeout(() => input.blur());
  return true;
}

export function getRow(
  cdkCell: ElementRef<HTMLDivElement>,
  position: 'previous' | 'next'
): Element | null {
  return (cdkCell.nativeElement.parentNode as any)?.[
    position + 'ElementSibling'
  ];
}

export function getCell(
  cdkCell: ElementRef<HTMLDivElement>,
  position: 'previous' | 'next'
): Element | null {
  const cell: Element = (cdkCell.nativeElement as any)[
    position + 'ElementSibling'
  ];
  return cell;
}

export function getRowCell<T extends object>(
  row: Element | null,
  col: ImperiaTableColumn<T>
): Element | null {
  if (!row) return null;

  const cell =
    row.getElementsByClassName(fieldToImperiaTableColumnClass(col.field))[0] ??
    null;

  if (!cell) return null;
  return cell;
}

export function getCdkRowCell<T extends object>(
  row: Element | null,
  col: ImperiaTableColumn<T>
): Element | null {
  if (!row) return null;

  const cell =
    row.getElementsByClassName(
      'cdk-column-' + col.field.replace(/:/g, '-')
    )[0] ?? null;

  if (!cell) return null;
  return cell;
}
//#endregion KEY FUNCTIONS

export function hasEditableClass(cell: Element) {
  return !!cell && cell.classList && cell.classList.contains('editable');
}

export function isFooterCell(cell: Element) {
  return cell.classList.contains('imperia-table-footer-cell');
}

export function closeEditing<TItem extends object>(
  cell: ImperiaTableCell<TItem>,
  cdkCell: ElementRef<HTMLDivElement>,
  input?: HTMLInputElement
) {
  input && input.removeEventListener('blur', () => {});
  cell.dataInfo.editing = false;
  cdkCell.nativeElement.classList.remove('editing');
  markCellAs('none', cdkCell);
}

export function isEditable<TItem extends object>(
  cell: ImperiaTableCell<TItem>,
  row: ImperiaTableRow<TItem>
) {
  return !cell.dataInfo.readonly && row.editable;
}

export function valueHasChanged<TItem extends object>(
  cell: ImperiaTableCell<TItem>,
  data: TItem
) {
  const previousValue = data[cell.field];
  if (
    'DecimalNumber' in data &&
    data.DecimalNumber &&
    typeof cell.control.value === 'number' &&
    typeof data.DecimalNumber === 'number' &&
    typeof previousValue === 'number'
  ) {
    return (
      roundTo(cell.control.value, data.DecimalNumber) !==
      roundTo(previousValue, data.DecimalNumber)
    );
  }
  if (!cell.control.value && !previousValue) return false;
  return cell.control.value !== previousValue;
}

export function hasBeenClicked$(input: HTMLInputElement): Observable<boolean> {
  return fromEvent(input, 'click').pipe(
    take(1),
    takeUntil(fromEvent(input, 'blur').pipe()),
    map(() => true)
  );
}

export function setCellTemplateContext<TItem extends object>(
  action: 'update' | 'reset',
  {
    colIndex,
    rowIndex,
    col,
    row,
  }: {
    colIndex: number;
    rowIndex: number;
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
  }
) {
  let newDataContext: TItem = row.data;
  if (action === 'update') {
    newDataContext = {
      ...row.data,
      [col.field]: row.cells[col.field].control.value,
    };
  }
  row.cells[col.field].templateContext = {
    $implicit: {
      col: col,
      row: new ImperiaTableRow(
        row.index,
        row.dataKey,
        newDataContext,
        row.columns,
        row.fromFooter
      ),
      colIndex: colIndex,
      rowIndex: rowIndex,
    },
  };
}

export function markCellAs(
  as: 'loading' | 'ok' | 'error' | 'none',
  cdkCell: ElementRef<HTMLDivElement> | HTMLDivElement | null | undefined
) {
  const cdkCellElement =
    cdkCell && 'nativeElement' in cdkCell ? cdkCell.nativeElement : cdkCell;
  if (!cdkCellElement) return;
  const wasMarkedAsLoading = cdkCellElement.classList.contains(
    'editable-cell__loading'
  );
  cdkCellElement.classList.remove(
    'editable-cell__loading',
    'editable-cell__ok',
    'editable-cell__error'
  );
  if (as == 'none') return;
  if ((as == 'ok' || as == 'error') && !wasMarkedAsLoading) return;
  cdkCellElement.classList.add(
    as == 'loading'
      ? 'editable-cell__loading'
      : as == 'ok'
      ? 'editable-cell__ok'
      : as == 'error'
      ? 'editable-cell__error'
      : ''
  );
  if (as == 'ok') {
    setTimeout(() => {
      cdkCellElement.classList.remove('editable-cell__ok');
    }, 2000);
  }
}
