import type { ImperiaTableRow } from './imperia-table-rows.models';
import type { TImperiaTableColumnField } from './imperia-table-columns.types';

export type ImperiaTableV2CellInternalSelection<TItem extends object> = Map<
  ImperiaTableRow<TItem>['dataKeyValue'],
  TImperiaTableColumnField<TItem>[]
>;
