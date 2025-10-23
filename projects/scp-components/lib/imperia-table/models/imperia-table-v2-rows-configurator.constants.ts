import { TImperiaTableColumnProperties } from './imperia-table-columns.types';

export const ROWS_CONFIGURATOR_TABLE_COLUMNS: TImperiaTableColumnProperties<any>[] =
  [
    {
      field: 'Label',
      header: '',
      dataInfo: { type: 'string' },
      width: 100,
      widthUnit: '%',
      resizable: false,
      sortable: false,
    },
    {
      field: 'visible',
      header: '',
      dataInfo: { type: 'string', readonly: true },
      width: 120,
      resizable: false,
      sortable: false,
    },
  ];
