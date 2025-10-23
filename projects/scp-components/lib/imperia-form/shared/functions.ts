import { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';
import { TImperiaTableColumnProperties } from '../../imperia-table/models/imperia-table-columns.types';

export function getImperiaFormFields<TItem extends object>(
  columns: TImperiaTableColumnProperties<TItem>[],
): ImperiaTableColumn<TItem>[] {
  return columns.map(
    (col) =>
      new ImperiaTableColumn(
        col.field,
        col.dataInfo,
        col.header,
        col.width,
        col,
      ),
  );
}
