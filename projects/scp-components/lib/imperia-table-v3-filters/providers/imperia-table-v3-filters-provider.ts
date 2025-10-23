import { InjectionToken } from '@angular/core';
import { ImperiaTableV3FiltersProvider } from '../directives/imperia-table-v3-filter.directive';

export const IMPERIA_TABLE_V3_FILTERS_PROVIDER = new InjectionToken<
  ImperiaTableV3FiltersProvider<any>
>('IMPERIA_TABLE_V3_FILTERS_PROVIDER');
