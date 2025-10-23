import { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';
import { ImperiaTableV3ColumnsGroupDirective } from '../directives/imperia-table-v3-columns-group-directive.directive';

export interface ImperiaTableV3ColumnsGroupInMatrixProperties<
  TItem extends object
> {
  frozen: boolean;
  frozenPosition: string;
  columns: ImperiaTableColumn<TItem>[];
  directive: ImperiaTableV3ColumnsGroupDirective<TItem>;
}
