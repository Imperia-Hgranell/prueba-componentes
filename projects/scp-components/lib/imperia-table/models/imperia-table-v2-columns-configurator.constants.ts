import { TImperiaTableColumnProperties } from './imperia-table-columns.types';

export const COLUMNS_CONFIGURATOR_TABLE_COLUMNS: TImperiaTableColumnProperties<any>[] =
  [
    {
      field: 'header',
      header: 'header',
      dataInfo: { type: 'string' },
      width: 100,
      widthUnit: '%',
      resizable: false,
      sortable: false,
    },
    {
      field: 'visible',
      header: 'visible',
      dataInfo: { type: 'string' },
      width: 120,
      resizable: false,
      sortable: false,
    },
    {
      field: 'frozen',
      header: 'frozen',
      dataInfo: { type: 'string' },
      width: 120,
      resizable: false,
      sortable: false,
    },
  ];
