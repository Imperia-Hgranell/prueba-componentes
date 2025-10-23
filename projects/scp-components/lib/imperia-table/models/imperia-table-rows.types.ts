import { ImperiaTableCell } from './imperia-table-cells.models';
import { TImperiaTableColumnField } from './imperia-table-columns.types';

/**
 * La propiedades que tengan que ver con altura de la fila (`height`, `min-height` y `max-height`)
 * estan omitidas por que no se definen a nivel de fila, si no a nivel general de la tabla
 */
export type TImperiaTableRowStyle = Partial<
  Omit<CSSStyleDeclaration, 'height' | 'minHeight' | 'maxHeight'>
>;

export type TImperiaTableRowCells<TItem extends object> = {
  [key in TImperiaTableColumnField<TItem>]: ImperiaTableCell<
    TItem,
    TImperiaTableColumnField<TItem>
  >;
};

export interface ImperiaTableRowCreateEvent<TItem extends object> {
  rowIndex: number;
  row: TItem;
}
