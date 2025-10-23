import { Signal } from '@angular/core';
import { ImperiaTableV2ColumnDirective } from '../../imperia-table/directives/imperia-table-v2-column.directive';

export interface ImperiaTableV3ColumnsProvider<TItem extends object> {
  $columns: Signal<readonly ImperiaTableV2ColumnDirective<TItem>[]>;
}
