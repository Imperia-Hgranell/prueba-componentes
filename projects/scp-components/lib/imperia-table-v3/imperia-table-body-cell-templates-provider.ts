import { InjectionToken } from '@angular/core';
import { ImperiaTableBodyCellTemplateDirective } from '../imperia-table/template-directives/imperia-table-body-cell-template.directive';
import { ImpUnitNameComponent } from '../imp-unit-name/imp-unit-name.component';
export const IMPERIA_TABLE_BODY_CELL_TEMPLATES_PROVIDER = new InjectionToken<
  ImperiaTableBodyCellTemplateDirective<any> | ImpUnitNameComponent<any>
>('IMPERIA_TABLE_V3_PAGINATION_PROVIDER');
