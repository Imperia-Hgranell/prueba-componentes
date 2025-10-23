import { Pipe, PipeTransform } from '@angular/core';
import { ImperiaTableCellEditTemplateContext } from '../directives/cell-edit-template.directive';
import { ImperiaTableCell } from '../models/imperia-table-cells.models';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';
/**
 * @deprecated
 */
@Pipe({
  name: 'cellTemplateContext',
    standalone: false
})
export class CellTemplateContextPipe implements PipeTransform {
  transform(
    cell: ImperiaTableCell<any>,
    col: ImperiaTableColumn<any>,
    row: ImperiaTableRow<any>,
  ): ImperiaTableCellEditTemplateContext {
    return {
      $implicit: cell,
      col,
      row,
    };
  }
}
