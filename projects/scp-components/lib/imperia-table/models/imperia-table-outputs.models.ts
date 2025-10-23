import { FormControl, FormGroup } from '@angular/forms';
import { Sort } from '@imperiascm/scp-utils/payload';
import {
  ImperiaFormDataSyncAction,
  ImperiaFormDataSyncState,
} from '../../imperia-form/models/imperia-form.types';
import { ImperiaTableColumn } from './imperia-table-columns.models';
import { TImperiaTableColumnField } from './imperia-table-columns.types';
import { ImperiaTableFilterValue } from './imperia-table-filters.models';
import { ImperiaTableRow } from './imperia-table-rows.models';
/**
 * Funcion para indicar a `ImperiaTable` o `ImperiaForm` el resultado de una operacion asincrona
 */
export type SetDataSyncFn = (
  action: ImperiaFormDataSyncAction,
  state: ImperiaFormDataSyncState,
  showMessage?: boolean,
  detail?: string
) => void;

/**
 * Funcion para actualizar una celda de `ImperiaTable`
 * Llama al evento `onRowRender` de `ImperiaTable`
 */
export type UpdateCellFn<TItem extends object> = (data: Partial<TItem>) => void;
/**
 * @deprecated
 */
export interface ImperiaTableRowAddEvent {
  form: FormGroup;
  /**
   * @deprecated
   */
  setDataSyncState: SetDataSyncFn;
}

export interface ImperiaTableCellSaveEvent<
  TItem extends object,
  TField extends TImperiaTableColumnField<TItem> = TImperiaTableColumnField<TItem>
> {
  field: TField;
  control: FormControl<TItem[TImperiaTableColumnField<TItem>] | null>;
  oldItem: TItem;
  newItem: TItem;
  oldValue: TItem[TImperiaTableColumnField<TItem>] | null;
  newValue: TItem[TImperiaTableColumnField<TItem>] | null;
  fromFooter: boolean;
  isSelected: boolean;
  row: ImperiaTableRow<TItem>;
  col: ImperiaTableColumn<TItem>;
  footerRow: ImperiaTableRow<TItem> | null;
  set: (data: Partial<TItem>) => void;
  setDataSyncState: SetDataSyncFn;
}

export interface ImperiaTableDeleteEvent<TItem extends object> {
  data: TItem[];
  result: (result: boolean) => void;
  /**
   * @deprecated
   */
  setDataSyncState: SetDataSyncFn;
}

export class ImperiaTableSortValue<TItem extends object> {
  Column: keyof TItem | string = '';
  Sort: Sort = Sort.NONE;
  constructor(
    column: string | TImperiaTableColumnField<TItem> = '',
    sort: Sort = Sort.NONE
  ) {
    this.Column = column;
    this.Sort = sort;
  }
}

export interface ImperiaTableScrollValue {
  Page: number;
  Size: number;
}

export interface IImperiaTableFilterSortScrollEvent<TItem extends object> {
  Filters?: ImperiaTableFilterValue<
    TItem,
    string | TImperiaTableColumnField<TItem>
  >[];
  Order?: Partial<ImperiaTableSortValue<TItem>>;
  Pagination?: Partial<ImperiaTableScrollValue>;
  Search?: string;
}

export class ImperiaTableFilterSortScrollEvent<TItem extends object> {
  Filters: ImperiaTableFilterValue<
    TItem,
    string | TImperiaTableColumnField<TItem>
  >[];
  Order: ImperiaTableSortValue<TItem>;
  Pagination: ImperiaTableScrollValue;
  Search: string;

  constructor(event: IImperiaTableFilterSortScrollEvent<TItem> = {}) {
    this.Filters = event.Filters ?? [];
    this.Order = {
      Column: event.Order?.Column ?? ('' as keyof TItem),
      Sort: event.Order?.Sort ?? Sort.NONE,
    };
    this.Pagination = {
      Page: event.Pagination?.Page ?? 1,
      Size: event.Pagination?.Size ?? 100,
    };
    this.Search = event.Search ?? '';
  }

  // /**
  //  * @param filter Filter to add
  //  * @returns `ImperiaTableFilterSortScrollEvent` with the new filter added
  //  */
  // public addFilter(
  //   filter: ImperiaTableFilterValue<
  //     TItem,
  //     string | TImperiaTableColumnField<TItem>
  //   >
  // ) {
  //   return new ImperiaTableFilterSortScrollEvent<TItem>({
  //     ...this,
  //     Filters: [
  //       ...this.Filters.filter(({ Column }) => Column != filter.Column),
  //       filter,
  //     ],
  //   });
  // }

  // /**
  //  * @param filter Filter to remove
  //  * @returns `ImperiaTableFilterSortScrollEvent` with the filter removed
  //  */
  // public removeFilter(
  //   filter: ImperiaTableFilterValue<
  //     TItem,
  //     string | TImperiaTableColumnField<TItem>
  //   >
  // ) {
  //   return new ImperiaTableFilterSortScrollEvent<TItem>({
  //     ...this,
  //     Filters: this.Filters.filter(({ Column }) => Column != filter.Column),
  //   });
  // }

  // /**
  //  * @description Returns a new `ImperiaTableFilterSortScrollEvent` with the pagination set to the `Pagination` param or the default pagination
  //  * @param Pagination Pagination to set in the event
  //  * @returns `ImperiaTableFilterSortScrollEvent` with the new pagination
  //  */
  // public withPagination(Pagination?: Partial<ImperiaTableScrollValue>) {
  //   return new ImperiaTableFilterSortScrollEvent<TItem>({
  //     ...this,
  //     Pagination: {
  //       Page: Pagination?.Page ?? 1,
  //       Size: Pagination?.Size ?? this.Pagination.Size,
  //     },
  //   });
  // }
}

export interface ImperiaTableHorizontalScrollValue<TItem extends object> {
  firstColumn: ImperiaTableColumn<TItem>;
  firstColumnIndex: number;
  lastColumn: ImperiaTableColumn<TItem>;
  lastColumnIndex: number;
  nextFirstColumnIndex: number;
  nextLastColumnIndex: number;
}

export interface ImperiaTableRowReorderEvent<TItem extends object> {
  item: TItem;
  newIndex: number;
  oldIndex: number;
  setDataSyncState: SetDataSyncFn;
}

export interface ImperiaTableCellClickEvent<TItem extends object> {
  colIndex: number;
  col: ImperiaTableColumn<TItem>;
  rowIndex: number;
  row: ImperiaTableRow<TItem>;
  footerRow: ImperiaTableRow<TItem> | null;
  fromFooter: boolean;
  isSelected: boolean;
  event: MouseEvent;
  cellElement: HTMLDivElement;
  updateCell: UpdateCellFn<TItem>;
}

/**
 * @deprecated Use `ImperiaTableV2ClickEvent` instead
 */
export interface ImperiaTableRowClickEvent<TItem extends object> {
  /**
   * @deprecated Use `row.index` instead
   */
  rowIndex: number;
  row: ImperiaTableRow<TItem>;
  isSelected: boolean;
  event: MouseEvent | KeyboardEvent;
}

export interface ImperiaTableColumnResizeEvent<TItem extends object> {
  columnResized: ImperiaTableColumn<TItem>;
  columnResizedIndex: number;
  frozenColumnsTotalWidth: number;
  scrollableColumnsTotalWidth: number;
  totalWidth: number;
}
