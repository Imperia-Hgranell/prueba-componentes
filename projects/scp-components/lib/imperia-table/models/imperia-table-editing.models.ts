import { ElementRef } from '@angular/core';
import { httpRequestState } from '@imperiascm/rxjs-utils';
import { ImperiaFormDataSyncState } from '../../imperia-form/models/imperia-form.types';
import { ImperiaTableColumn } from './imperia-table-columns.models';
import { ImperiaTableRow } from './imperia-table-rows.models';

export interface ImperiaTableCellEditEvent<TItem extends object> {
  col: ImperiaTableColumn<TItem>;
  colIndex: number;
  row: ImperiaTableRow<TItem>;
  rowIndex: number;
  cellElement: ElementRef<HTMLDivElement> | ElementRef<HTMLTableCellElement>;
  result: (state: httpRequestState) => void;
  /**
   * @deprecated
   * Use `result` instead with `httpRequestState` only if this event is coming from `ImperiaTableV2Component`
   */
  editableCellValueSyncFn: (state: ImperiaFormDataSyncState) => void;
}
