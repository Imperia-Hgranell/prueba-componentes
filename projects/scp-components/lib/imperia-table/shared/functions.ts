import { FormGroup } from '@angular/forms';
import { injectPost } from '@imperiascm/http';
import { ImperiaTableColumnsGroup } from '../models/imperia-table-columns-groups.models';
import { TImperiaTableColumnsGroupProperties, TImperiaTableColumnsGroupTranslation, TImperiaTableColumnsGroupsTranslation } from '../models/imperia-table-columns-groups.types';
import { IImperiaTableColumnDataBoolean, IImperiaTableColumnDataNumber, IImperiaTableColumnDataSelect, TIImperiaTableColumnDataInfoType, TImperiaTableColumnDataInfoType, TImperiaTableColumnDataInfoTypes, TImperiaTableColumnField, TImperiaTableColumnProperties, TImperiaTableColumnTranslation, TImperiaTableColumnsTranslation } from '../models/imperia-table-columns.types';
import { ImperiaTableFilterView, TImperiaTableFilterViewProperties } from '../models/imperia-table-filter-views.models';
import { ImperiaTableFilterValue } from '../models/imperia-table-filters.models';
import { ImpTranslateService } from '@imperiascm/translate';
import { firstValueFrom } from 'rxjs';
import { TImperiaTableCellStyle } from '../models/imperia-table-cells.types';
import {
  ImperiaTableColumn,
  ImperiaTableColumnDataBoolean,
  ImperiaTableColumnDataDate,
  ImperiaTableColumnDataNumber,
  ImperiaTableColumnDataSelect,
  ImperiaTableColumnDataString,
  ImperiaTableColumnDataStringWithHelp,
  ImperiaTableColumnDataTable,
  ImperiaTableColumnDataTextArea,
} from '../models/imperia-table-columns.models';
import {
  ImperiaTableFilterSortScrollEvent,
  ImperiaTableSortValue,
} from '../models/imperia-table-outputs.models';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';

export function generateItemConstColumns<TItem extends object>(
  item: TItem
): void {
  const splitCaps = (string: string) =>
    string
      .replace(/([a-z])([A-Z]+)/g, (m, s1, s2) => s1 + ' ' + s2)
      .replace(
        /([A-Z])([A-Z]+)([^a-zA-Z0-9]*)$/,
        (m, s1, s2, s3) => s1 + s2.toLowerCase() + s3
      )
      .replace(
        /([A-Z]+)([A-Z][a-z])/g,
        (m, s1, s2) => s1.toLowerCase() + ' ' + s2
      );

  const snakeCase = (string: string) =>
    splitCaps(string)
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map((word) => word.toLowerCase())
      .join('_');
}

export function generateJSONTranslation<TItem extends object>(
  item: TItem
): void {
  const splitCaps = (string: string) =>
    string
      .replace(/([a-z])([A-Z]+)/g, (m, s1, s2) => s1 + ' ' + s2)
      .replace(
        /([A-Z])([A-Z]+)([^a-zA-Z0-9]*)$/,
        (m, s1, s2, s3) => s1 + s2.toLowerCase() + s3
      )
      .replace(
        /([A-Z]+)([A-Z][a-z])/g,
        (m, s1, s2) => s1.toLowerCase() + ' ' + s2
      );

  const snakeCase = (string: string) =>
    splitCaps(string)
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map((word) => word.toLowerCase())
      .join('_');
}

export function getImperiaTableColumns<TItem extends object = any>(
  columnsProperties: TImperiaTableColumnProperties<TItem>[],
  translations?: TImperiaTableColumnsTranslation<TItem>
): ImperiaTableColumn<TItem>[] {
  return columnsProperties.map((col) =>
    getImperiaTableColumn(col, translations?.[col.field])
  );
}

export function getImperiaTableColumn<
  TItem extends object,
  TDataInfoType extends TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes
>(
  columnProperties: TImperiaTableColumnProperties<TItem, TDataInfoType>,
  translation?: TImperiaTableColumnTranslation
): ImperiaTableColumn<TItem, TDataInfoType> {
  setTranslationDataInfo(columnProperties.dataInfo, translation?.dataInfo);
  if (columnProperties.dataInfo.type === 'select') {
    setTranslationDataInfoSelect(
      columnProperties.dataInfo,
      translation?.dataInfo
    );
  }
  if (columnProperties.dataInfo.type === 'boolean') {
    setTranslationDataInfoBoolean(
      columnProperties.dataInfo,
      translation?.dataInfo
    );
  }
  if (columnProperties.dataInfo.type === 'number') {
    setTranslationDataInfoNumber(
      columnProperties.dataInfo,
      translation?.dataInfo
    );
  }
  const column = new ImperiaTableColumn(
    columnProperties.field,
    columnProperties.dataInfo,
    translation?.header ?? columnProperties.header,
    columnProperties.width,
    {
      ...columnProperties,
      label:
        translation?.label ||
        translation?.header ||
        columnProperties.label ||
        columnProperties.header,
    }
  );
  return column;
}

export function getImperiaTableColumnsGroups<TItem extends object = any>(
  columnsGroups: TImperiaTableColumnsGroupProperties<TItem>[],
  translations: TImperiaTableColumnsGroupsTranslation
): ImperiaTableColumnsGroup<TItem>[] {
  return columnsGroups.map((group) =>
    getImperiaTableColumnsGroup(group, translations[group.key])
  );
}

export function getImperiaTableColumnsGroup<TItem extends object>(
  columnGroupProperties: TImperiaTableColumnsGroupProperties<TItem>,
  translation?: TImperiaTableColumnsGroupTranslation
): ImperiaTableColumnsGroup<TItem> {
  return new ImperiaTableColumnsGroup(
    columnGroupProperties.key,
    columnGroupProperties.columns,
    translation?.header ?? columnGroupProperties.key
  );
}

function setTranslationDataInfo(
  dataInfo: TIImperiaTableColumnDataInfoType,
  translation?: {
    placeholder?: string;
    defaultValue?: string;
  }
) {
  if (translation?.placeholder) {
    dataInfo.placeholder = translation.placeholder;
  }
  if (translation?.defaultValue) {
    dataInfo.defaultValue = translation.defaultValue;
  }
}

function setTranslationDataInfoSelect(
  dataInfo: IImperiaTableColumnDataSelect<any>,
  translation?: {
    options?: string[] | { [key: string]: string };
  }
) {
  if (!translation?.options) return;
  if (Array.isArray(translation.options)) {
    for (const [index, option] of dataInfo.options.entries()) {
      if (translation.options[index]) {
        option[dataInfo.labelProperty] = translation.options[index];
      }
    }
  } else {
    for (const option of dataInfo.options) {
      if (translation.options[option[dataInfo.translationKey]]) {
        option[dataInfo.labelProperty] =
          translation.options[option[dataInfo.translationKey]];
      }
    }
  }
}

function setTranslationDataInfoBoolean(
  dataInfo: IImperiaTableColumnDataBoolean,
  translation?: { trueLabel?: string; falseLabel?: string }
) {
  if (translation?.trueLabel) {
    dataInfo.trueLabel = translation.trueLabel;
  }
  if (translation?.falseLabel) {
    dataInfo.falseLabel = translation.falseLabel;
  }
}

function setTranslationDataInfoNumber(
  dataInfo: IImperiaTableColumnDataNumber,
  translation?: { suffix?: string; prefix?: string }
) {
  if (translation?.suffix) {
    dataInfo.suffix = translation.suffix;
  }
  if (translation?.prefix) {
    dataInfo.prefix = translation.prefix;
  }
}
/**
 * Este mÃ©todo extrae las columnas de un array de columnas en el orden que se indique en el array de fields
 * @param fieldsToExtract Los campos de las columnas que se quieren extraer
 * @param columns El array de columnas del cual se quieren extraer las columnas
 * @param keepColumnsOnOriginalArray Si se quiere mantener las columnas en el array original o no
 * @returns Las columnas extraidas del array de columnas en un array en el mismo orden que los fields indicados
 */
export function extractColumnsFrom<TItem extends object>(
  fieldsToExtract: TImperiaTableColumnField<TItem>[],
  columns: ImperiaTableColumn<TItem>[],
  keepColumnsOnOriginalArray = false
) {
  const extractedColumns: ImperiaTableColumn<TItem>[] = [];
  for (const field of fieldsToExtract) {
    const columnIndex = columns.findIndex((col) => col.field === field);
    if (columnIndex < 0) continue;
    if (keepColumnsOnOriginalArray) {
      extractedColumns.push(columns[columnIndex]);
    } else {
      extractedColumns.push(...columns.splice(columnIndex, 1));
    }
  }
  return extractedColumns;
}

export function getImperiaTableFilterViews<TItem extends object>(
  views: TImperiaTableFilterViewProperties<TItem>[]
): ImperiaTableFilterView<TItem>[] {
  return views.map(
    (view) => new ImperiaTableFilterView(view.id, view.name, view.fields, view)
  );
}

export async function onFilterChildImperiaTable<TItem extends object>(
  post: ReturnType<typeof injectPost>,
  colDataInfo: ImperiaTableColumnDataTable<TItem>,
  fss: ImperiaTableFilterSortScrollEvent<TItem>,
  translateService: ImpTranslateService
) {
  await getAsyncDataForCellEditingOrColumnFilterTable(
    post,
    colDataInfo,
    translateService,
    fss
  );
}

export async function onSortChildImperiaTable<TItem extends object>(
  post: ReturnType<typeof injectPost>,
  colDataInfo: ImperiaTableColumnDataTable<TItem>,
  fss: ImperiaTableFilterSortScrollEvent<TItem>,
  translateService: ImpTranslateService
) {
  await getAsyncDataForCellEditingOrColumnFilterTable(
    post,
    colDataInfo,
    translateService,
    fss
  );
}

export async function onScrollCompleteChildImperiaTable<TItem extends object>(
  post: ReturnType<typeof injectPost>,
  colDataInfo: ImperiaTableColumnDataTable<TItem>,
  fss: ImperiaTableFilterSortScrollEvent<TItem>,
  translateService: ImpTranslateService
) {
  await getAsyncDataForCellEditingOrColumnFilterTable(
    post,
    colDataInfo,
    translateService,
    fss
  );
}

export async function onSearchChildImperiaTable<TItem extends object>(
  post: ReturnType<typeof injectPost>,
  colDataInfo: ImperiaTableColumnDataTable<TItem>,
  fss: ImperiaTableFilterSortScrollEvent<TItem>,
  translateService: ImpTranslateService
) {
  await getAsyncDataForCellEditingOrColumnFilterTable(
    post,
    colDataInfo,
    translateService,
    fss
  );
}

export async function getAsyncDataForCellEditingOrColumnFilterTable<
  TItem extends object
>(
  post: ReturnType<typeof injectPost>,
  colDataInfo: ImperiaTableColumnDataTable<TItem>,
  translateService: ImpTranslateService,
  fss: ImperiaTableFilterSortScrollEvent<TItem> = new ImperiaTableFilterSortScrollEvent()
): Promise<any> {
  const resp = await firstValueFrom(
    post(
      colDataInfo.endpoint.url,
      colDataInfo.endpoint.hasFilters
        ? {
            ...colDataInfo.endpoint.body,
            ...fss,
            Filters: !!colDataInfo.endpoint.body.Filters
              ? [...fss.Filters, ...colDataInfo.endpoint.body.Filters]
              : [...fss.Filters],
          }
        : colDataInfo.endpoint.body
    )
  );
  if (resp.ok) {
    if (colDataInfo.valueMapper) {
      resp.data = colDataInfo.valueMapper(
        resp.data,
        translateService.translation
      );
    }
    colDataInfo.value =
      fss.Pagination.Page > 1
        ? [...colDataInfo.value, ...resp.data]
        : resp.data;
  } else {
    colDataInfo.value = [];
  }
}

export function onSelectionChangeChildImperiaTable<
  TItem extends { [key: string]: any }
>(
  selection: TItem[] | TItem,
  formGroup: FormGroup,
  formFieldKey: TImperiaTableColumnField<TItem>
) {
  const control = formGroup.controls[formFieldKey];
  if (Array.isArray(selection)) {
    control.setValue(selection);
  } else if (selection) {
    control.setValue(selection);
  } else {
    control.setValue(null);
  }
  control.markAsDirty();
}
export function cellValue<TItem extends object>(
  row: ImperiaTableRow<TItem>,
  field: TImperiaTableColumnField<TItem>,
  value?: TItem[typeof field]
) {
  if (row.cells[field] === undefined) return null;
  if (value === undefined) {
    return row.data[field];
  }
  row.data[field] = value;
  return row.data[field];
}
export function cellStyle<TItem extends object>(
  row: ImperiaTableRow<TItem>,
  field: TImperiaTableColumnField<TItem>,
  style?: TImperiaTableCellStyle
) {
  if (row.cells[field] === undefined) return {};
  if (!style) {
    return row.cells[field].style;
  }
  row.cells[field].style = {
    ...row.cells[field].style,
    ...style,
  };
  return row.cells[field].style;
}
export function cellDataInfo<TItem extends object>(
  row: ImperiaTableRow<TItem>,
  field: TImperiaTableColumnField<TItem>,
  dataInfo: Partial<TIImperiaTableColumnDataInfoType>
): TImperiaTableColumnDataInfoType | null {
  if (row.cells[field] === undefined) return null;
  if (!dataInfo) {
    return row.cells[field].dataInfo;
  }
  Object.assign(
    row.cells[field].dataInfo,
    getDataInfo({
      ...row.cells[field].dataInfo,
      ...(dataInfo as any),
    })
  );
  return row.cells[field].dataInfo;
}

/**
 * @deprecated
 * use `cellValue` instead
 */
export function cellProperty<TItem extends object>(
  row: ImperiaTableRow<TItem>,
  field: TImperiaTableColumnField<TItem>,
  property: 'value',
  value?: TItem[typeof field]
): TItem[typeof field];
/**
 * @deprecated
 * use `cellStyle` instead
 */
export function cellProperty<TItem extends object>(
  row: ImperiaTableRow<TItem>,
  field: TImperiaTableColumnField<TItem>,
  property: 'style',
  value?: TImperiaTableCellStyle
): TImperiaTableCellStyle;
/**
 * @deprecated
 * use `cellDataInfo` instead
 */
export function cellProperty<TItem extends object>(
  row: ImperiaTableRow<TItem>,
  field: TImperiaTableColumnField<TItem>,
  property: 'dataInfo',
  value: TIImperiaTableColumnDataInfoType
): TImperiaTableColumnDataInfoType;
export function cellProperty<TItem extends object>(
  row: ImperiaTableRow<TItem>,
  field: TImperiaTableColumnField<TItem>,
  property: 'style' | 'value' | 'dataInfo',
  value?: typeof property extends 'style'
    ? TImperiaTableCellStyle
    : typeof property extends 'value'
    ? TItem[typeof field]
    : typeof property extends 'dataInfo'
    ? TImperiaTableColumnDataInfoType
    : any
) {
  if (value) {
    if (property == 'style') {
      row.cells[field].style = {
        ...row.cells[field].style,
        ...value,
      };
      return row.cells[field].style;
    } else if (property == 'value') {
      row.data[field] = value;
      return row.cells[field].value;
    } else if (property == 'dataInfo') {
      Object.assign(
        row.cells[field].dataInfo,
        getDataInfo({
          ...row.cells[field].dataInfo,
          ...value,
        })
      );
    }
    return null;
  } else {
    if (property == 'style') {
      return row.cells[field].style;
    } else if (property == 'value') {
      return row.cells[field].value;
    }
    return null;
  }
}

function getDataInfo<TType extends TImperiaTableColumnDataInfoTypes>(
  dataInfo: TIImperiaTableColumnDataInfoType<TType>
): TImperiaTableColumnDataInfoType<TType> {
  switch (dataInfo.type) {
    case 'string':
      return new ImperiaTableColumnDataString(
        dataInfo
      ) as TImperiaTableColumnDataInfoType<TType>;
    case 'string-with-help':
      return new ImperiaTableColumnDataStringWithHelp<any>(
        dataInfo
      ) as TImperiaTableColumnDataInfoType<TType>;
    case 'textarea':
      return new ImperiaTableColumnDataTextArea(
        dataInfo
      ) as TImperiaTableColumnDataInfoType<TType>;
    case 'number':
      return new ImperiaTableColumnDataNumber(
        dataInfo
      ) as TImperiaTableColumnDataInfoType<TType>;
    case 'date':
      return new ImperiaTableColumnDataDate(
        dataInfo
      ) as TImperiaTableColumnDataInfoType<TType>;
    case 'select':
      return new ImperiaTableColumnDataSelect(
        dataInfo
      ) as TImperiaTableColumnDataInfoType<TType>;
    case 'boolean':
      return new ImperiaTableColumnDataBoolean(
        dataInfo
      ) as TImperiaTableColumnDataInfoType<TType>;
    case 'table':
      return new ImperiaTableColumnDataTable(
        dataInfo
      ) as TImperiaTableColumnDataInfoType<TType>;

      console.error('No se ha definido el tipo de dato');
  }
}

/**
 *
 * @param array El array de datos donde se agregaran los nuevos datos
 * @param data Los nuevos datos a agregar
 * @param event El evento de la tabla
 * @param clearArray Si se debe limpiar el array de datos
 * @returns Si clearArray es true, devuelve un array vacio, si no, devuelve el array de datos con los nuevos datos agregados
 */
export function paginate<TItem extends object>(
  array: TItem[],
  data: TItem[],
  event: ImperiaTableFilterSortScrollEvent<TItem>,
  clearArray: boolean = false
) {
  if (clearArray) {
    array = [];
    return array;
  }
  return event.Pagination.Page > 1 ? [...array, ...data] : data;
}

export function getFiltersFromStorage<TItem extends object>(
  storageKey: string | undefined
): ImperiaTableFilterValue<TItem, string>[] {
  try {
    if (!storageKey) return [];
    const filters = localStorage.getItem(storageKey + '_filters');
    if (!filters) return [];
    return JSON.parse(filters);
  } catch (error) {
    localStorage.removeItem(storageKey + '_filters');
    return [];
  }
}

export function setFiltersToStorage(
  key: string | undefined,
  filters: ImperiaTableFilterValue<any, string>[]
) {
  if (!key) return;
  localStorage.setItem(key + '_filters', JSON.stringify(filters));
}

export function getSortFromStorage<TItem extends object>(
  storageKey: string | undefined
): ImperiaTableSortValue<TItem> {
  try {
    if (!storageKey) return new ImperiaTableSortValue<TItem>();
    const sort = localStorage.getItem(storageKey + '_sort');
    if (!sort) return new ImperiaTableSortValue<TItem>();
    return JSON.parse(sort);
  } catch (error) {
    localStorage.removeItem(storageKey + '_sort');
    return new ImperiaTableSortValue<TItem>();
  }
}

export function setSortToStorage<TItem extends object>(
  key: string | undefined,
  sort: ImperiaTableSortValue<TItem>
) {
  if (!key) return;
  localStorage.setItem(key + '_sort', JSON.stringify(sort));
}
