import { InjectionToken } from '@angular/core';
import { ImperiaTableV3ColumnsProvider } from './interfaces/imperia-table-v3-columns-provider';

export const IMPERIA_TABLE_V3_COLUMN_GROUPS_PROVIDER = new InjectionToken(
  'IMPERIA_TABLE_V3_COLUMN_GROUPS_PROVIDER'
);

export const IMPERIA_TABLE_V3_COLUMNS_PROVIDER = new InjectionToken<
  ImperiaTableV3ColumnsProvider<any>
>('IMPERIA_TABLE_V3_COLUMNS_PROVIDER');
