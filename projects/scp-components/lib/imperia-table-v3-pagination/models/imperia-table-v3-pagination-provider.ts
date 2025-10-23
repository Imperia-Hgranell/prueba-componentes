import { InjectionToken } from '@angular/core';
import { ImperiaTableV3ManualPaginationComponent } from '../components/imperia-table-v3-manual-pagination/imperia-table-v3-manual-pagination.component';
import { ImperiaTableV3PaginationComponent } from '../components/imperia-table-v3-pagination/imperia-table-v3-pagination.component';

export const IMPERIA_TABLE_V3_PAGINATION_PROVIDER = new InjectionToken<
  ImperiaTableV3PaginationComponent | ImperiaTableV3ManualPaginationComponent
>('IMPERIA_TABLE_V3_PAGINATION_PROVIDER');
