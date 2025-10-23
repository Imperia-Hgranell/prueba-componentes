import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { IMIN_DATE } from '@imperiascm/scp-utils/constants';
import { ImpInputNumberModes } from '../../primeng/imp-input-number/imp-input-number.component';
import { ImpInputTextAreaResize } from '../../primeng/imp-input-textarea/imp-input-textarea.component';
import { ImperiaTableColumn, ImperiaTableColumnDataBoolean, ImperiaTableColumnDataDate, ImperiaTableColumnDataNumber, ImperiaTableColumnDataSelect, ImperiaTableColumnDataString, ImperiaTableColumnDataStringWithHelp, ImperiaTableColumnDataTable, ImperiaTableColumnDataTextArea } from './imperia-table-columns.models';
import { ImperiaTableFilterValue } from './imperia-table-filters.models';
import { TCompleteTranslation } from '@imperiascm/translate';
import { FilterOperator } from '@imperiascm/scp-utils/payload';
import { Sort } from '@imperiascm/scp-utils/payload';

/**
 * Las propiedades de `TItem` que pueden ser el `field` de `ImperiaTableColumn`
 */
export type TImperiaTableColumnField<TItem> = Extract<keyof TItem, string>;

/**
 * @description Interfaz que define las propiedades de una columna de la tabla ImperiaTable
 */
interface IImperiaTableColumn<
  TItem extends object,
  TDataInfoType extends TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes
> {
  field: TImperiaTableColumnField<TItem>;
  dataInfo: TIImperiaTableColumnDataInfoType<TDataInfoType>;
  header: string;
  width: number | 'auto';
  widthUnit?: 'px' | '%';
  minWidth?: number;
  minWidthUnit?: 'px' | '%';
  maxWidth?: number | 'none';
  maxWidthUnit?: 'px' | '%';
  headerCellStyle?: TImperiaTableColumnStyle;
  headerTextStyle?: TImperiaTableColumnStyle;
  headerCellClass?: string;
  frozen?: boolean;
  frozenPosition?: 'left' | 'right';
  visible?: boolean;
  configurable?: boolean;
  label?: string;
  showAtForm?: boolean;
  resizable?: boolean;
  skipHeaderOnAdjust?: boolean;
  sortable?: boolean;
  sortDirection?: Sort;
  allowFilter?: boolean;
  allowDelete?: boolean;
  filterFormValue?: { value: any; operator: FilterOperator };
  filterName?: TImperiaTableColumnField<TItem> | string;
  required?: boolean;
  disabledAsFilter?: boolean;
  disabledAsFilterText?: string;
  allowConfigConfigurator?: boolean;
}

/**
 * Este tipo contiene las propiedades requeridas para crear una columna de la tabla.
 * - No usar para crear columnas, solo para objetos con los que luego se podran crear columnas usando `getImperiaTableColumns()`, si se quiere declarar una columna o array de columnas se debe usar `new ImperiaTableColumn()`
 */
export type TImperiaTableColumnRequiredProperties<
  TItem extends object,
  TDataInfoType extends TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes
> = Pick<
  IImperiaTableColumn<TItem, TDataInfoType>,
  'field' | 'header' | 'width' | 'dataInfo'
>;

/**
 * Este tipo contiene las propiedades de la columna que `NO` son requeridas o que tienen valores por defecto
 * - No usar para crear columnas, solo para objetos con los que luego se podran crear columnas usando `getImperiaTableColumns()`, si se quiere declarar una columna o array de columnas se debe usar `new ImperiaTableColumn()`
 */
export type TImperiaTableColumnOptionalProperties<
  TItem extends object,
  TDataInfoType extends TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes
> = Partial<
  Pick<
    IImperiaTableColumn<TItem, TDataInfoType>,
    | 'widthUnit'
    | 'minWidth'
    | 'minWidthUnit'
    | 'maxWidth'
    | 'maxWidthUnit'
    | 'headerCellStyle'
    | 'headerTextStyle'
    | 'headerCellClass'
    | 'frozen'
    | 'frozenPosition'
    | 'resizable'
    | 'skipHeaderOnAdjust'
    | 'sortable'
    | 'sortDirection'
    | 'visible'
    | 'configurable'
    | 'label'
    | 'showAtForm'
    | 'allowFilter'
    | 'filterFormValue'
    | 'filterName'
    | 'required'
    | 'disabledAsFilter'
    | 'disabledAsFilterText'
    | 'allowConfigConfigurator'
  >
>;

/**
 * Este tipo contiene todas las propiedades de la columna, sean requeridas o no
 * - No usar para crear columnas, solo para objetos con los que luego se podran crear columnas usando `getImperiaTableColumns()`, si se quiere declarar una columna o array de columnas se debe usar `new ImperiaTableColumn()`
 */
export type TImperiaTableColumnProperties<
  TItem extends object,
  TDataInfoType extends TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes
> = TImperiaTableColumnRequiredProperties<TItem, TDataInfoType> &
  TImperiaTableColumnOptionalProperties<TItem, TDataInfoType>;

/**
 * La propiedades que tengan que ver con anchura de la columna (`width`, `min-width` y `max-width`)
 * estan omitidas por que no se definen a nivel de header y body, si no a nivel de columna entera
 */
export type TImperiaTableColumnStyle = Partial<
  Omit<CSSStyleDeclaration, 'width' | 'minWidth' | 'maxWidth'>
>;

/**
 * El objeto de traducciones de una columna
 */
export type TImperiaTableColumnTranslation = {
  header: string;
  label?: string;
  dataInfo?: {
    options?: string[] | { [key: string]: string };
    placeholder?: string;
    suffix?: string;
    prefix?: string;
    trueLabel?: string;
    falseLabel?: string;
    [key: string]: any;
  };
};

/**
 * El objeto de traducciones de varias columnas
 */
export type TImperiaTableColumnsTranslation<TItem extends object> = Partial<{
  [K in TImperiaTableColumnField<TItem>]: TImperiaTableColumnTranslation;
}>;

export type TImperiaTableRegisterName = {
  singular: string;
  plural: string;
  gender: string;
};
/**
 * Todos los tipos posibles de datos que puede tener una columna
 */
export type TImperiaTableColumnDataInfoTypes =
  | 'string'
  | 'string-with-help'
  | 'textarea'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'table';

export interface ImperiaTableColumnDataInfoFormValidations {
  validators?: ValidatorFn | ValidatorFn[] | null;
  asyncValidators?: AsyncValidatorFn | AsyncValidatorFn[] | null;
}

/**
 * `ConditionalType` de todas las `INTERFACES` de los tipos de datos que puede tener una columna
 */
export type TIImperiaTableColumnDataInfoType<
  T extends TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes
> = T extends 'string'
  ? IImperiaTableColumnDataString
  : T extends 'string-with-help'
  ? IImperiaTableColumnDataStringWithHelp
  : T extends 'textarea'
  ? IImperiaTableColumnDataTextArea
  : T extends 'number'
  ? IImperiaTableColumnDataNumber
  : T extends 'date'
  ? IImperiaTableColumnDataDate
  : T extends 'select'
  ? IImperiaTableColumnDataSelect
  : T extends 'boolean'
  ? IImperiaTableColumnDataBoolean
  : T extends 'table'
  ? IImperiaTableColumnDataTable
  : never;
/**
 * `ConditionalType` de todas las `CLASES` de los tipos de datos que puede tener una columna
 */
export type TImperiaTableColumnDataInfoType<
  T extends TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes
> = T extends 'string'
  ? ImperiaTableColumnDataString
  : T extends 'string-with-help'
  ? ImperiaTableColumnDataStringWithHelp
  : T extends 'textarea'
  ? ImperiaTableColumnDataTextArea
  : T extends 'number'
  ? ImperiaTableColumnDataNumber
  : T extends 'date'
  ? ImperiaTableColumnDataDate
  : T extends 'select'
  ? ImperiaTableColumnDataSelect
  : T extends 'boolean'
  ? ImperiaTableColumnDataBoolean
  : T extends 'table'
  ? ImperiaTableColumnDataTable
  : never;
/**
 * `INTERFAZ` de las propiedades en comun de todos los tipos de datos que puede tener una columna
 * - `editing` si es `true` el valor se muestra en modo edicion
 * - `editingColWidth` ancho de la columna en modo edicion
 * - `readonly` si es `true` el valor se muestra en modo lectura
 * - `formValidations` validaciones para el formulario de edicion
 * - `validators` validaciones para el formulario de edicion
 * - `asyncValidators` validaciones asincronas para el formulario de edicion
 */
export type IImperiaTableColumnDataInfo = {
  /**
   * Si es `true` el valor se muestra en modo edicion
   */
  editing: boolean;
  /**
   * Ancho de la columna en modo edicion
   * - Si no se especifica se usa el ancho de la columna en modo lectura
   */
  editingColWidth: number;
  /**
   * Si es `true` el valor se muestra en modo lectura
   */
  readonly: boolean;
  /**
   * Valor a mostrar cuando no hay valor en el campo
   */
  placeholder?: string;
  /**
   * Indica si el campo esta deshabilitado al inicio del formulario.
   * Esta propiedad es `solo` para `uso interno` en el `imperia-form`,
   * si se quiere saber si estaba deshabilitado al inicio,
   * existe la propiedad `wasDisabledOnStart`
   */
  startDisabled?: boolean;
  /**
   * Valor por defecto que se aplicara al formControl
   */
  defaultValue?: any;
  /**
   * Validaciones para el formulario de edicion
   * - `validators` validaciones para el formulario de edicion
   * - `asyncValidators` validaciones asincronas para el formulario de edicion
   * - `validators` y `asyncValidators` se pueden especificar como `ValidatorFn` o `ValidatorFn[]` o `null`
   */
  formValidations: ImperiaTableColumnDataInfoFormValidations;
  /**
   * Si es `true` se aÃ±adirÃ¡ un `*` marcÃ¡ndolo como campo requerido
   */
  required?: boolean;
};

/**
 * `INTERFAZ` de las propiedades para el tipo de dato `string`
 * - `isPassword` si es `true` el valor se muestra como asteriscos
 */
export type IImperiaTableColumnDataString = {
  type: 'string';
  /**
   * Si es `true` el valor se muestra como asteriscos
   */
  isPassword?: boolean;
} & Partial<IImperiaTableColumnDataInfo>;

/**
 * `INTERFAZ` de las propiedades para el tipo de dato `string-with-help`
 */
export type IImperiaTableColumnDataStringWithHelp<
  TOption = any,
  TAsync extends boolean = boolean
> = {
  type: 'string-with-help';
  allowCustomValue?: boolean;
  allowMultipleValues?: boolean;
  async?: TAsync;
  addQuotationsForExactFilter?: boolean;
  optionLabel?:
    | keyof TOption
    | { labels: (keyof TOption)[]; labelSeparator: string };
  optionValue?: keyof TOption;
  disabled?: boolean;
  pageSize?: number;
  filters?: ImperiaTableFilterValue<any, string>[];
} & (TAsync extends true
  ? {
      endpoint: string;
      body: any;
      hasFilters: boolean;
      options?: TOption[];
      valueMapper?: (data: any, translation: TCompleteTranslation) => TOption[];
    }
  : {
      options: TOption[];
      endpoint?: string;
      body?: any;
      hasFilters?: boolean;
      valueMapper?: (data: any, translation: TCompleteTranslation) => TOption[];
    }) &
  Partial<IImperiaTableColumnDataInfo>;

/**
 * `INTERFAZ` de las propiedades para el tipo de dato `textarea`
 * - `autoResize` si es `true` el textarea se ajusta automaticamente a su contenido
 * - `resize` si es `true` el textarea se puede redimensionar
 * - `height` altura del textarea
 * - `expandedHeight` altura del textarea cuando esta expandido
 * - `showExpandButton` si es `true` se muestra un boton para expandir el textarea
 */
export type IImperiaTableColumnDataTextArea = {
  type: 'textarea';
  /**
   * Si es `true` el textarea se ajusta automaticamente a su contenido
   */
  autoResize?: boolean;
  /**
   * Si es `true` el textarea se puede redimensionar
   */
  resize?: ImpInputTextAreaResize;
  /**
   * Altura del textarea
   */
  height?: number;
  /**
   * Altura del textarea cuando esta expandido
   */
  expandedHeight?: number;
  /**
   * Si es `true` se muestra un boton para expandir el textarea
   */
  showExpandButton?: boolean;
} & Partial<IImperiaTableColumnDataInfo>;

/**
 * `INTERFAZ` de las propiedades para el tipo de dato `number`
 * - `mode` indica como se debe mostrar el valor
 * - `prefix` indica el simbolo que se debe mostrar antes del valor
 * - `suffix` indica el simbolo que se debe mostrar despues del valor
 * - `min` indica el valor minimo que puede tener el campo
 * - `max` indica el valor maximo que puede tener el campo
 * - `minFractionDigits` indica la cantidad minima de decimales que se deben mostrar
 * - `maxFractionDigits` indica la cantidad maxima de decimales que se deben mostrar
 * - `step` indica el valor de incremento que se debe usar
 */
export type IImperiaTableColumnDataNumber = {
  type: 'number';
  /**
   * Indica como se debe mostrar el valor
   * - `decimal` muestra el valor con decimales
   * - `currency` muestra el valor como moneda
   */
  mode?: ImpInputNumberModes;
  /**
   * Indica el simbolo que se debe mostrar antes del valor
   */
  prefix?: string;
  /**
   * Indica el simbolo que se debe mostrar despues del valor
   */
  suffix?: string;
  /**
   * Indica el valor minimo que puede tener el campo
   * - `null` no tiene limite minimo
   */
  min?: number | null;
  /**
   * Indica el valor maximo que puede tener el campo
   * - `null` no tiene limite maximo
   */
  max?: number | null;
  /**
   * Indica el numero minimo de decimales que puede tener el campo
   * - `null` no tiene limite minimo de decimales
   * - `0` no permite decimales
   */
  minFractionDigits?: number | null;
  /**
   * Indica el numero maximo de decimales que puede tener el campo
   * - `null` no tiene limite maximo de decimales
   * - `0` no permite decimales
   */
  maxFractionDigits?: number | null;
  /**
   * Indica la cantidad de valores que suma o resta al valor actual al cambiarlo con los botones de `+` y `-`
   * - `0` no se puede cambiar el valor con los botones de `+` y `-`
   */
  step?: number;
  /**
   * Indica si el campo es un enlace
   */
  isLink?: boolean;
  /**
   * Valor a mostrar en el input cuando no hay valor
   */
  placeholder?: string;
  allowFilterByRange?: boolean;
  specialCaseConfig?: { value: any; label: string };
} & Partial<IImperiaTableColumnDataInfo>;

/**
 * `INTERFAZ` de las propiedades para el tipo de dato `date`
 */
export type IImperiaTableColumnDataDate = {
  type: 'date';
  format?: string;
  timeOnly?: boolean;
  showTime?: boolean;
  allowFilterByRange?: boolean;
  minDate?: IMIN_DATE;
} & Partial<IImperiaTableColumnDataInfo>;

/**
 * `INTERFAZ` de las propiedades para el tipo de dato `boolean`
 */
export type IImperiaTableColumnDataBoolean = {
  type: 'boolean';
  /**
   * Valor que determina si el campo es `true`
   */
  trueValue?: any;
  /**
   * Valor que determina si el campo es `false`
   */
  falseValue?: any;
  /**
   * Valor que se mostrarÃ¡ cuando el campo es `true`
   */
  trueLabel?: string;
  /**
   * Valor que se mostrarÃ¡ cuando el campo es `false`
   */
  falseLabel?: string;
} & Partial<IImperiaTableColumnDataInfo>;

/**
 * `INTERFAZ` de las propiedades para el tipo de dato `select`
 */
export type IImperiaTableColumnDataSelect<TSelectItem extends object = any> = {
  type: 'select';
  /**
   * Opciones que se deben mostrar en el select
   */
  options: TSelectItem[];
  /**
   * Propiedad que se debe usar como valor
   */
  keyProperty: string;
  /**
   * Propiedad que se debe usar como label
   */
  labelProperty: string;
  /**
   * Propiedad que se debe usar como key para la traduccion
   */
  translationKey: string;
  /**
   * Propiedad que marca si la opcion esta deshabilitada
   */
  disabledProperty?: string;
  /**
   * Texto a mostrar si no hay ningun valor seleccionado
   */
  placeholder?: string;
} & Partial<IImperiaTableColumnDataInfo>;

/**
 * `INTERFAZ` de las propiedades para el tipo de dato `table`
 */
export type IImperiaTableColumnDataTable<
  TTableItem extends object = any,
  TTableItemDataKey extends keyof TTableItem = any,
  TTableItemDataLabel extends keyof TTableItem = any
> = {
  type: 'table';
  /**
   * Endpoint que se debe usar para obtener los datos
   */
  endpoint: { url: string; hasFilters: boolean; body?: any; loaded?: boolean };
  /**
   * Propiedad que almacena los valores de la tabla
   */
  value?: TTableItem[];
  /**
   * Propiedad que almacena las columnas de la tabla
   */
  columns?: ImperiaTableColumn<TTableItem>[];
  /**
   * Propiedad que almacena las propiedades para crear las columnas de la tabla
   */
  columnsProperties: TImperiaTableColumnProperties<TTableItem>[];
  /**
   * Propiedad que almacena la propiedad que se debe usar como key
   */
  dataKey: TTableItemDataKey;
  /**
   * Propiedad que almacena la propiedad que se debe usar como label
   */
  dataLabel: TTableItemDataLabel;
  /**
   * Indica si debe devolver el objeto completo o solo el valor de la propiedad `dataKey`
   */
  fullData?: boolean;
  /**
   * Key para traducir los textos de la tabla
   */
  translationKey: keyof TCompleteTranslation;
  /**
   * Indica el modo de seleccion de la tabla
   */
  selectionMode?: 'single' | 'multiple';
  /**
   * TamaÃ±o de pagina de la table
   */
  pageSize?: number;
  /**
   * Activa o desactiva los eventos de scroll de la tabla
   */
  scrollEvents?: boolean;
  /**
   * Activa o desactiva la posibilidad de eliminar el selection de la tabla
   */
  allowDelete?: boolean;
  /**
   *
   * @param data Los datos del endpoint
   * @param translation El JSON de traducciones
   * @returns Un array de `TTableItem`
   */
  valueMapper?: (data: any, translation: TCompleteTranslation) => TTableItem[];
} & Partial<IImperiaTableColumnDataInfo>;
