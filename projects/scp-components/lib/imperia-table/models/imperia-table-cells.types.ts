import { httpRequestState } from '@imperiascm/rxjs-utils';
import { ImperiaTableColumn } from './imperia-table-columns.models';
import { ImperiaTableRow } from './imperia-table-rows.models';

/**
 * La propiedades que tengan que ver con altura o anchura de la celda (`height`, `min-height`, `max-height`, `width`, `min-width` y `max-width`)
 * estan omitidas por que no se definen a nivel de celda, si no a nivel de columna o a nivel general de la tabla
 */
export type TImperiaTableCellStyle = Partial<
  Omit<
    CSSStyleDeclaration,
    'height' | 'minHeight' | 'maxHeight' | 'width' | 'minWidth' | 'maxWidth'
  >
>;

export type ImperiaTableCellTemplateContext<TItem extends object = any> = {
  $implicit: ImperiaTableCellTemplateData<TItem>;
};

export type ImperiaTableCellTemplateData<TItem extends object = any> = {
  col: ImperiaTableColumn<TItem>;
  colIndex: number;
  row: ImperiaTableRow<TItem>;
  rowIndex: number;
};

export type ImperiaTableCellEditRequestState = Partial<httpRequestState>;
