import { Pipe, PipeTransform, TemplateRef } from '@angular/core';
import { ImperiaTableCellEditTemplateContext } from '../directives/cell-edit-template.directive';
import { ImperiaTableCell } from '../models/imperia-table-cells.models';
import { TImperiaTableColumnDataInfoTypes } from '../models/imperia-table-columns.types';
/**
 * @deprecated
 */
@Pipe({
  name: 'cellTemplate',
    standalone: false
})
export class CellTemplatePipe implements PipeTransform {
  transform(
    cellTemplates: {
      [K in TImperiaTableColumnDataInfoTypes]?: TemplateRef<ImperiaTableCellEditTemplateContext>;
    },
    cell: ImperiaTableCell<any>,
    editing: boolean,
    loading: boolean,
    loadingTemplate: TemplateRef<any>,
    fallbackTemplate: TemplateRef<any>,
    noEditTemplate: TemplateRef<any>,
  ): TemplateRef<any> {
    return loading
      ? loadingTemplate
      : editing
        ? (cellTemplates[cell.dataInfo.type] ?? fallbackTemplate)
        : noEditTemplate;
  }
}
