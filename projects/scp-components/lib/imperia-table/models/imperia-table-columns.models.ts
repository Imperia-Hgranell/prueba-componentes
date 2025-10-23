import { TemplateRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IMIN_DATE } from '@imperiascm/scp-utils/constants';
import { ImpInputNumberModes } from '../../primeng/imp-input-number/imp-input-number.component';
import { ImpInputTextAreaResize } from '../../primeng/imp-input-textarea/imp-input-textarea.component';
import { ImperiaTableCellTemplateContext } from './imperia-table-cells.types';
import { IImperiaTableColumnDataBoolean, IImperiaTableColumnDataDate, IImperiaTableColumnDataInfo, IImperiaTableColumnDataNumber, IImperiaTableColumnDataSelect, IImperiaTableColumnDataString, IImperiaTableColumnDataStringWithHelp, IImperiaTableColumnDataTable, IImperiaTableColumnDataTextArea, ImperiaTableColumnDataInfoFormValidations, TIImperiaTableColumnDataInfoType, TImperiaTableColumnDataInfoType, TImperiaTableColumnDataInfoTypes, TImperiaTableColumnField, TImperiaTableColumnOptionalProperties, TImperiaTableColumnProperties, TImperiaTableColumnStyle, TImperiaTableRegisterName } from './imperia-table-columns.types';
import { ImperiaTableFilterValue } from './imperia-table-filters.models';
import { ColumnConfiguration } from './imperia-table-v2-columns-configurator.models';
import { ImperiaTableBodyCellTemplateContext } from '../template-directives/imperia-table-body-cell-template.directive';
import { ImperiaTableHeaderCellTemplateContext } from '../template-directives/imperia-table-header-cell-template.directive';
import { TCompleteTranslation } from '@imperiascm/translate';
import { FilterOperator } from '@imperiascm/scp-utils/payload';
import { Sort } from '@imperiascm/scp-utils/payload';
import {
  BehaviorSubject,
  Observable,
  Subject,
  map,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';

/**
 * @description Clase que define las propiedades de una columna de la tabla ImperiaTable
 */
export class ImperiaTableColumn<
  TItem extends object,
  TDataInfoType extends TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes
> {
  field: TImperiaTableColumnField<TItem>;
  dataInfo!: TImperiaTableColumnDataInfoType<TDataInfoType>;
  configurable: boolean;

  //#region VISIBLE
  private _visible: boolean = true;
  public get visible() {
    return this._visible;
  }
  public set visible(v: boolean) {
    this._visible = v;
    this.configuration.visible = v;
  }
  //#endregion VISIBLE

  //#region FILTER DISABLED
  private _disabledAsFilter: boolean = true;
  public get disabledAsFilter() {
    return this._disabledAsFilter;
  }
  public set disabledAsFilter(v: boolean) {
    this._disabledAsFilter = v;
  }

  private _disabledAsFilterText: string = '';
  public get disabledAsFilterText() {
    return this._disabledAsFilterText;
  }
  public set disabledAsFilterText(v: string) {
    this._disabledAsFilterText = v;
  }
  //#endregion FILTER DISABLED

  //#region CONFIGURATION
  configuration: ColumnConfiguration;
  //#endregion CONFIGURATION

  //#region HEADER
  header: string;
  headerCellStyle: TImperiaTableColumnStyle;
  headerTextStyle: TImperiaTableColumnStyle;
  headerCellClass: string;
  //#endregion HEADER

  //#region FROZEN
  private _frozen: boolean = false;
  public get frozen() {
    return this._frozen;
  }
  public set frozen(v: boolean) {
    this._frozen = v;
    this.configuration.frozen = v;
  }
  private _frozenPosition: 'left' | 'right' = 'left';
  public get frozenPosition() {
    return this._frozenPosition;
  }
  public set frozenPosition(v: 'left' | 'right') {
    this._frozenPosition = v;
    this.configuration.frozenPosition = v;
  }
  //#endregion FROZEN

  //#region RESIZE
  resizable: boolean;
  skipHeaderOnAdjust: boolean;
  hasBeenResized: boolean;
  //#endregion RESIZE

  //#region SORT
  sortable: boolean;
  private sortDirection: BehaviorSubject<Sort> = new BehaviorSubject<Sort>(
    Sort.NONE
  );
  get sort$(): Observable<Sort> {
    return this.sortDirection;
  }
  setHeader(header: string) {
    this.header = header;
  }
  sort(direction: Sort) {
    this.sortDirection.next(direction);
  }
  isSorted$: Observable<boolean> = this.sortDirection.pipe(
    map((sort) => sort !== ''),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion SORT

  //#region FILTER
  public toggleFilterConfigurator: Subject<void> = new Subject<void>();
  filterConfiguratorVisibility$: Observable<boolean> =
    this.toggleFilterConfigurator.pipe(
      switchMap(() =>
        this.filterConfiguratorVisibility$.pipe(
          take(1),
          map((v) => !v)
        )
      ),
      map((visible) => visible),
      startWith(false),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  get hasFilterConfigurator(): boolean {
    return (
      this.dataInfo.type !== 'number' &&
      this.dataInfo.type !== 'boolean' &&
      this.dataInfo.type !== 'date' &&
      this.allowConfigConfigurator
    );
  }
  allowConfigConfigurator: boolean = true;
  allowFilter: boolean;
  filterName: TImperiaTableColumnField<TItem> | string;
  private filterValue: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  updateFilterValue(value: any) {
    this.filterValue.next(value);
  }
  get filterValueChange$(): Observable<any> {
    return this.filterValue;
  }
  private filterOperator: BehaviorSubject<FilterOperator> =
    new BehaviorSubject<FilterOperator>(FilterOperator.EQUAL);
  updateFilterOperator(operator: FilterOperator) {
    this.filterOperator.next(operator);
  }
  get filterOperatorChange$(): Observable<FilterOperator> {
    return this.filterOperator;
  }
  isFiltered$: Observable<boolean> = this.filterValue.pipe(
    map((value) => ![null, undefined, '', []].includes(value)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public setFilters(value: any, operator: FilterOperator) {
    this.filterValue.next(value);
    this.filterOperator.next(operator);
  }
  public asFilter<
    TColumnAsString extends boolean = true,
    TValueAsString extends boolean = false
  >(options?: {
    columnAsString?: TColumnAsString;
    valueAsString?: TValueAsString;
  }): TColumnAsString extends true
    ? ImperiaTableFilterValue<TItem, string>
    : ImperiaTableFilterValue<TItem, ImperiaTableColumn<TItem>> {
    const { columnAsString = true, valueAsString = false } = options ?? {};
    return {
      Column: columnAsString ? this.filterName : this,
      Value: valueAsString
        ? this.filterValue.value + ''
        : this.filterValue.value,
      Operator: this.filterOperator.value,
    } as any;
  }
  //#endregion FILTER

  //#region TEMPLATES
  headerCellTemplate:
    | TemplateRef<ImperiaTableHeaderCellTemplateContext>
    | undefined;
  bodyCellTemplate:
    | TemplateRef<ImperiaTableBodyCellTemplateContext>
    | undefined;
  //#endregion TEMPLATES

  //#region WIDTH
  private _width: BehaviorSubject<number | 'auto'>;
  get width(): number | 'auto' {
    return this._width.value;
  }
  set width(value: number | 'auto') {
    this._width.next(value);
  }
  width$: Observable<string>;
  widthUnit: 'px' | '%';
  //#endregion WIDTH

  //#region MIN WIDTH
  _minWidth: number;
  get minWidth(): string {
    return this._minWidth + (this._minWidth === 0 ? '' : this.minWidthUnit);
  }
  minWidthUnit: 'px' | '%';
  //#endregion MIN WIDTH

  //#region MAX WIDTH
  _maxWidth: number | 'none';
  get maxWidth(): string {
    return (
      this._maxWidth + (this._maxWidth === 'none' ? '' : this.maxWidthUnit)
    );
  }
  maxWidthUnit: 'px' | '%';
  //#endregion MAX WIDTH

  //#region REQUIRED
  required?: boolean;
  //#endregion REQUIRED

  //#region IS LAST IN GROUP
  isLastInGroup: boolean = false;
  //#endregion IS LAST IN GROUP

  //#region DEPRECATED
  /**
   * Convierte el filtro de la columna en un objeto de tipo ImperiaTableFilterValue<TItem, string | TImperiaTableColumnField<TItem>>
   * @returns ImperiaTableFilterValue<TItem, string | TImperiaTableColumnField<TItem>>
   * @deprecated
   */
  toFilterString(
    valueAsString: boolean = false
  ): ImperiaTableFilterValue<TItem, string> {
    return {
      Column: this.filterName,
      Value: valueAsString
        ? this.filterForm.controls['value'].value + ''
        : this.filterForm.controls['value'].value,
      Operator: this.filterForm.controls['operator'].value,
    };
  }
  /**
   * @deprecated
   */
  label: string;
  /**
   * @deprecated
   */
  cellTemplate: TemplateRef<ImperiaTableCellTemplateContext> | undefined;
  /**
   * @deprecated
   */
  sortDirection$: BehaviorSubject<Sort> = new BehaviorSubject<Sort>(Sort.NONE);
  /**
   * @deprecated
   */
  get sortIcon$(): Observable<string> {
    return this.sortDirection$.pipe(
      map((sort) => {
        switch (sort) {
          case 'ASC':
            return 'pi-sort-alpha-down';
          case 'DESC':
            return 'pi-sort-alpha-down-alt';
          default:
            return '';
        }
      })
    );
  }
  /**
   * @deprecated
   */
  filterForm = new FormGroup({
    value: new FormControl<any>(null),
    operator: new FormControl<FilterOperator>(FilterOperator.EQUAL, {
      nonNullable: true,
    }),
  });
  /**
   * @deprecated
   */
  resizing: boolean;
  /**
   * @deprecated
   */
  showAtForm: boolean;
  /**
   * @deprecated
   */
  filtered$: Observable<boolean> = this.filterForm.controls[
    'value'
  ].valueChanges.pipe(
    startWith(this.filterForm.controls['value'].value),
    map(
      () =>
        ![null, undefined, '', []].includes(
          this.filterForm.controls['value'].value
        )
    ),
    tap((filtered) => (this.filtered = filtered))
  );
  /**
   * @deprecated
   */
  filtered: boolean = false;
  /**
   * @deprecated
   */
  setFilterValues(
    value: any,
    operator: FilterOperator,
    options: {
      onlySelf?: boolean | undefined;
      emitEvent?: boolean | undefined;
      emitModelToViewChange?: boolean | undefined;
      emitViewToModelChange?: boolean | undefined;
    } = {}
  ) {
    this.filterForm.controls['value'].setValue(value, options);
    this.filterForm.controls['operator'].setValue(operator, options);
  }
  /**
   * Convierte el filtro de la columna en un objeto de tipo ImperiaTableFilterValue<TItem, ImperiaTableColumn<TItem>>
   * @returns ImperiaTableFilterValue<TItem, ImperiaTableColumn<TItem>>
   * @deprecated
   */
  toFilter(): ImperiaTableFilterValue<TItem, ImperiaTableColumn<TItem>> {
    return {
      Column: this,
      Value: this.filterForm.controls['value'].value,
      Operator: this.filterForm.controls['operator'].value,
    };
  }
  //#endregion DEPRECATED

  constructor(
    field: TImperiaTableColumnField<TItem>,
    dataInfo: TIImperiaTableColumnDataInfoType<TDataInfoType>,
    header: string,
    width: number | 'auto',
    {
      headerCellStyle,
      headerTextStyle,
      headerCellClass,
      frozen,
      frozenPosition,
      resizable,
      skipHeaderOnAdjust,
      sortable,
      sortDirection,
      visible,
      configurable,
      label,
      showAtForm,
      widthUnit,
      minWidth,
      minWidthUnit,
      maxWidth,
      maxWidthUnit,
      allowFilter,
      filterFormValue,
      filterName,
      required,
      disabledAsFilter,
      disabledAsFilterText,
      allowConfigConfigurator,
    }: Partial<TImperiaTableColumnOptionalProperties<TItem, TDataInfoType>> = {}
  ) {
    this.field = field;
    switch (dataInfo.type) {
      case 'string':
        (this.dataInfo as ImperiaTableColumnDataString) =
          new ImperiaTableColumnDataString(dataInfo);
        break;
      case 'string-with-help':
        (this.dataInfo as ImperiaTableColumnDataStringWithHelp) =
          new ImperiaTableColumnDataStringWithHelp(dataInfo);
        break;
      case 'textarea':
        (this.dataInfo as ImperiaTableColumnDataTextArea) =
          new ImperiaTableColumnDataTextArea(dataInfo);
        break;
      case 'number':
        (this.dataInfo as ImperiaTableColumnDataNumber) =
          new ImperiaTableColumnDataNumber(dataInfo);
        break;
      case 'date':
        (this.dataInfo as ImperiaTableColumnDataDate) =
          new ImperiaTableColumnDataDate(dataInfo);
        break;
      case 'select':
        (this.dataInfo as ImperiaTableColumnDataSelect) =
          new ImperiaTableColumnDataSelect(dataInfo);
        break;
      case 'boolean':
        (this.dataInfo as ImperiaTableColumnDataBoolean) =
          new ImperiaTableColumnDataBoolean(dataInfo);
        break;
      case 'table':
        (this.dataInfo as ImperiaTableColumnDataTable) =
          new ImperiaTableColumnDataTable(dataInfo);
        break;

      default:
        console.error('No se ha definido el tipo de dato');
        break;
    }
    this._visible = visible ?? true;
    this.configurable = configurable ?? true;

    //#region DISABLED AS FILTER
    this.disabledAsFilter = disabledAsFilter ?? false;
    this.disabledAsFilterText = disabledAsFilterText ?? '';
    //#endregion DISABLED AS FILTER

    //#region HEADER
    this.header = header;
    this.headerCellStyle = headerCellStyle ?? {};
    this.headerTextStyle = headerTextStyle ?? {};
    this.headerCellClass = headerCellClass ?? '';
    //#endregion HEADER

    //#region FROZEN
    this._frozen = frozen ?? false;
    this._frozenPosition = frozenPosition ?? 'left';
    //#endregion FROZEN

    //#region RESIZE
    this.resizable = resizable ?? this.visible;
    this.skipHeaderOnAdjust = skipHeaderOnAdjust ?? false;
    this.hasBeenResized = false;
    //#endregion RESIZE

    //#region SORT
    this.sortable = sortable ?? visible ?? true;
    if (this.sortable) {
      this.sort(sortDirection ?? Sort.NONE);
    }
    //#endregion SORT

    //#region FILTER
    this.allowFilter = allowFilter ?? visible ?? true;
    this.filterName = filterName ?? field;
    if (this.allowFilter) {
      this.setFilters(
        filterFormValue?.value ?? null,
        filterFormValue?.operator ?? FilterOperator.EQUAL
      );
    }
    //#endregion FILTER

    //#region WIDTH
    this._width = new BehaviorSubject<number | 'auto'>(width);
    this.width$ = this._width.pipe(
      map(() => `${this.width}${this.width == 'auto' ? '' : this.widthUnit}`),
      shareReplay({
        bufferSize: 1,
        refCount: true,
      })
    );
    this.widthUnit = widthUnit ?? 'px';
    //#endregion WIDTH

    //#region MIN WIDTH
    this._minWidth = minWidth ?? 50;
    this.minWidthUnit = minWidthUnit ?? 'px';
    //#endregion MIN WIDTH

    //#region MAX WIDTH
    this._maxWidth = maxWidth ?? 800;
    this.maxWidthUnit = maxWidthUnit ?? 'px';
    //#endregion MAX WIDTH

    //#region REQUIRED
    this.required = required;
    //#endregion REQUIRED

    //#region FILTER CONFIGURATOR
    this.allowConfigConfigurator = allowConfigConfigurator ?? true;
    //#endregion FILTER CONFIGURATOR

    //#region CONFIGURATION
    this.configuration = new ColumnConfiguration(
      this.field,
      this.frozen,
      this.frozenPosition,
      this.visible
    );
    //#endregion CONFIGURATION

    //#region DEPRECATED
    this.label = label ?? header;
    this.resizing = false;
    if (filterFormValue?.value) {
      this.filtered = true;
      this.setFilterValues(filterFormValue.value, filterFormValue.operator, {
        emitEvent: false,
      });
    }
    this.sortDirection$ = new BehaviorSubject(sortDirection ?? Sort.NONE);
    this.showAtForm = showAtForm ?? this.visible ?? true;
    //#endregion DEPRECATED
  }

  /**
   *
   * @param col Columna de la que copiar las propiedades que se tienen que mantener en la nueva
   * @returns La columna con las propiedades copiadas para mantener referencias de memoria
   */
  public asCopyOf(
    col: ImperiaTableColumn<TItem, TDataInfoType>
  ): ImperiaTableColumn<TItem, TDataInfoType> {
    if (this.sortable && col.sortable) {
      this.sortDirection = col.sortDirection;
      this.isSorted$ = col.isSorted$;
    }

    if (this.allowFilter && col.allowFilter) {
      this.filterValue = col.filterValue;
      this.filterOperator = col.filterOperator;
      this.isFiltered$ = col.isFiltered$;
    }

    if (this.visible && col.visible && col.hasBeenResized) {
      this.hasBeenResized = col.hasBeenResized;
      this._width = col._width;
      this.width$ = col.width$;
    }

    return this;
  }
}
/**
 * Clase base para la definiciÃ³n de la informaciÃ³n de la columna
 */
export class ImperiaTableColumnDataInfo {
  editing: boolean;
  editingColWidth: number;
  readonly: boolean;
  defaultValue: any;
  placeholder: string;
  formValidations: ImperiaTableColumnDataInfoFormValidations;
  /**
   * Esta propiedad es `solo` para `uso interno` en el `imperia-form`,
   * si se quiere saber si estaba deshabilitado al inicio,
   * existe la propiedad `wasDisabledOnStart`
   */
  public startDisabled: boolean;
  private _wasDisabledOnStart: boolean;
  get wasDisabledOnStart(): boolean {
    return this._wasDisabledOnStart;
  }
  /**
   * asigna las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna
   * @param dataInfo Las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna
   * @param dataInfo.editing Indica si la columna es editable
   * @param dataInfo.editingColWidth Indica el ancho de la columna en modo ediciÃ³n
   * @param dataInfo.readonly Indica si la columna es de solo lectura
   * @param dataInfo.defaultValue El valor por defecto de la columna
   * @param dataInfo.placeholder El placeholder de la columna
   * @param dataInfo.formValidations Las validaciones del formulario
   * @param dataInfo.formValidations.validators Las validaciones del formulario
   * @param dataInfo.formValidations.asyncValidators Las validaciones asincronas del formulario
   * @param dataInfo.startDisabled Indica si la columna esta deshabilitada al inicio
   */
  constructor(dataInfo: Partial<IImperiaTableColumnDataInfo>) {
    this.editing = dataInfo.editing ?? false;
    this.editingColWidth = dataInfo.editingColWidth || 0;
    this.readonly = dataInfo.readonly ?? false;
    this.defaultValue = dataInfo.defaultValue ?? null;
    this.placeholder = dataInfo.placeholder ?? '';
    this.startDisabled = dataInfo.startDisabled ?? false;
    this._wasDisabledOnStart = this.startDisabled;
    this.formValidations = dataInfo.formValidations || {};
  }
}

/**
 * Clase para la definiciÃ³n de la informaciÃ³n de la columna de tipo string
 */
export class ImperiaTableColumnDataString extends ImperiaTableColumnDataInfo {
  type: 'string' = 'string';
  isPassword: boolean = false;
  /**
   * asigna las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo string
   * @param dataInfo Las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo string
   * @param dataInfo.isPassword Indica si el campo es de tipo password
   * @param dataInfo.editing Indica si el campo es editable
   * @param dataInfo.editingColWidth Indica el ancho de la columna en modo ediciÃ³n
   * @param dataInfo.readonly Indica si el campo es de solo lectura
   * @param dataInfo.formValidations Indica las validaciones del campo
   * @param dataInfo.formValidations.validators Indica las validaciones del campo
   * @param dataInfo.formValidations.asyncValidators Indica las validaciones asÃ­ncronas del campo
   */
  constructor(dataInfo: IImperiaTableColumnDataString) {
    super({ ...dataInfo, defaultValue: dataInfo.defaultValue ?? null });
    this.isPassword = dataInfo.isPassword ?? false;
  }
}

/**
 * Clase para la definiciÃ³n de la informaciÃ³n de la columna de tipo string-with-help
 */
export class ImperiaTableColumnDataStringWithHelp<
  TOption = any,
  TAsync extends boolean = boolean
> extends ImperiaTableColumnDataInfo {
  type: 'string-with-help' = 'string-with-help';
  allowMultipleValues: boolean;
  allowCustomValue: boolean;
  async: TAsync;
  addQuotationsForExactFilter?: boolean;
  optionLabel:
    | keyof TOption
    | { labels: (keyof TOption)[]; labelSeparator: string };
  optionValue: keyof TOption;
  disabled: boolean;
  endpoint: string;
  body: any;
  hasFilters: boolean;
  filters: ImperiaTableFilterValue<any, string>[];
  pageSize: number;
  options: TOption[];
  valueMapper: (data: any, translation: TCompleteTranslation) => TOption[];
  /**
   * asigna las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo string-with-help
   * @param dataInfo Las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo string-with-help
   * @param dataInfo.editing Indica si el campo es editable
   * @param dataInfo.editingColWidth Indica el ancho de la columna en modo ediciÃ³n
   * @param dataInfo.readonly Indica si el campo es de solo lectura
   * @param dataInfo.formValidations Indica las validaciones del campo
   * @param dataInfo.formValidations.validators Indica las validaciones del campo
   * @param dataInfo.formValidations.asyncValidators Indica las validaciones asÃ­ncronas del campo
   */
  constructor(
    dataInfo: IImperiaTableColumnDataStringWithHelp<TOption, TAsync>
  ) {
    super({ ...dataInfo, defaultValue: dataInfo.defaultValue ?? null });
    this.async = dataInfo.async ?? (false as TAsync);
    this.addQuotationsForExactFilter = dataInfo.addQuotationsForExactFilter;
    this.optionLabel = dataInfo.optionLabel ?? ('label' as keyof TOption);
    this.optionValue = dataInfo.optionValue ?? ('value' as keyof TOption);
    this.disabled = dataInfo.disabled ?? false;
    this.endpoint = dataInfo.endpoint ?? '';
    this.body = dataInfo.body ?? {};
    this.hasFilters = dataInfo.hasFilters ?? false;
    this.filters = dataInfo.filters ?? [];
    this.pageSize = dataInfo.pageSize ?? 100;
    this.options = dataInfo.options ?? [];
    this.allowCustomValue = dataInfo.allowCustomValue ?? false;
    this.allowMultipleValues = dataInfo.allowMultipleValues ?? false;
    this.valueMapper = dataInfo.valueMapper ?? ((data: any): any[] => data);
  }
}
/**
 * Clase para la definiciÃ³n de la informaciÃ³n de la columna de tipo textarea
 */
export class ImperiaTableColumnDataTextArea extends ImperiaTableColumnDataInfo {
  type: 'textarea' = 'textarea';
  autoResize: boolean;
  resize: ImpInputTextAreaResize;
  height: number;
  expandedHeight: number;
  showExpandButton: boolean;
  /**
   * asigna las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo textarea
   * @param dataInfo Las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo textarea
   * @param dataInfo.autoResize Indica si el textarea se debe redimensionar automaticamente
   * @param dataInfo.resize Indica el tipo de redimensionamiento del textarea
   * @param dataInfo.height Indica la altura del textarea
   * @param dataInfo.expandedHeight Indica la altura del textarea cuando se expande
   * @param dataInfo.showExpandButton Indica si se debe mostrar el boton de expandir el textarea
   * @param dataInfo.editing Indica si la columna se encuentra en modo ediciÃ³n
   * @param dataInfo.editingColWidth Indica el ancho de la columna en modo ediciÃ³n
   * @param dataInfo.readonly Indica si la columna se encuentra en modo solo lectura
   * @param dataInfo.formValidations Indica las validaciones del formulario
   * @param dataInfo.formValidations.validators Indica las validaciones del formulario
   * @param dataInfo.formValidations.asyncValidators Indica las validaciones asincronas del formulario
   */
  constructor(dataInfo: IImperiaTableColumnDataTextArea) {
    super({ ...dataInfo, defaultValue: dataInfo.defaultValue ?? null });
    this.autoResize = dataInfo.autoResize ?? false;
    this.resize = dataInfo.resize ?? 'vertical';
    this.height = dataInfo.height ?? 30;
    this.expandedHeight = dataInfo.expandedHeight ?? 100;
    this.showExpandButton = dataInfo.showExpandButton ?? false;
  }
}
/**
 * Clase para la definiciÃ³n de la informaciÃ³n de la columna de tipo date
 */
export class ImperiaTableColumnDataNumber extends ImperiaTableColumnDataInfo {
  type: 'number' = 'number';
  mode: ImpInputNumberModes;
  prefix: string;
  suffix: string;
  min: number | null;
  max: number | null;
  minFractionDigits: number | null;
  maxFractionDigits: number | null;
  step: number;
  isLink: boolean;
  allowFilterByRange: boolean = false;
  specialCaseConfig?: { value: any; label: string };
  /**
   * asigna las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo number
   * @param dataInfo Las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo number
   * @param dataInfo.mode Indica el modo de visualizaciÃ³n del campo
   * @param dataInfo.prefix Indica el prefijo del campo
   * @param dataInfo.suffix Indica el sufijo del campo
   * @param dataInfo.min Indica el valor minimo del campo
   * @param dataInfo.max Indica el valor maximo del campo
   * @param dataInfo.minFractionDigits Indica el numero minimo de decimales del campo
   * @param dataInfo.maxFractionDigits Indica el numero maximo de decimales del campo
   * @param dataInfo.step Indica el paso del campo
   * @param dataInfo.isLink Indica si el campo es un link
   * @param dataInfo.editing Indica si el campo es editable
   * @param dataInfo.editingColWidth Indica el ancho de la columna en modo ediciÃ³n
   * @param dataInfo.readonly Indica si el campo es de solo lectura
   * @param dataInfo.formValidations Indica las validaciones del campo
   * @param dataInfo.formValidations.validators Indica las validaciones del campo
   * @param dataInfo.formValidations.asyncValidators Indica las validaciones asÃ­ncronas del campo
   * @param dataInfo.specialCaseConfig Indica si es necesario incluir el toggle en el componente de filtros para filtrar por un specialCase (null, undefined, etc)
   */
  constructor(dataInfo: IImperiaTableColumnDataNumber) {
    super({ ...dataInfo, defaultValue: dataInfo.defaultValue ?? 0 });
    this.mode = dataInfo.mode ?? 'decimal';
    this.prefix = dataInfo.prefix ?? '';
    this.suffix = dataInfo.suffix ?? '';
    this.min = dataInfo.min ?? null;
    this.max = dataInfo.max ?? null;
    this.minFractionDigits = dataInfo.minFractionDigits ?? null;
    this.maxFractionDigits = dataInfo.maxFractionDigits ?? null;
    this.step = dataInfo.step ?? 0;
    this.isLink = dataInfo.isLink ?? false;
    this.allowFilterByRange = dataInfo.allowFilterByRange ?? false;
    this.specialCaseConfig = dataInfo.specialCaseConfig;
  }
}
/**
 * Clase para la definiciÃ³n de la informaciÃ³n de la columna de tipo date
 */
export class ImperiaTableColumnDataDate extends ImperiaTableColumnDataInfo {
  type: 'date' = 'date';
  format: string;
  timeOnly: boolean;
  showTime: boolean;
  allowFilterByRange: boolean = false;
  minDate: IMIN_DATE | null = null;
  overlayOpen: Subject<boolean> = new Subject<boolean>();
  /**
   * asigna las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo date
   * @param dataInfo Las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo date
   * @param dataInfo.editing Indica si el campo es editable
   * @param dataInfo.editingColWidth Indica el ancho de la columna en modo ediciÃ³n
   * @param dataInfo.readonly Indica si el campo es de solo lectura
   * @param dataInfo.formValidations Indica las validaciones del campo
   * @param dataInfo.formValidations.validators Indica las validaciones del campo
   * @param dataInfo.formValidations.asyncValidators Indica las validaciones asÃ­ncronas del campo
   * @param dataInfo.overlayOpen Indica si el overlay del calendar estÃ¡ abierto
   */
  constructor(dataInfo: IImperiaTableColumnDataDate) {
    super({ ...dataInfo, defaultValue: dataInfo.defaultValue ?? null });
    this.format = dataInfo.format ?? 'dd/MM/yyyy';
    this.timeOnly = dataInfo.timeOnly ?? false;
    this.showTime = dataInfo.showTime ?? false;
    this.allowFilterByRange = dataInfo.allowFilterByRange ?? false;
    this.minDate = dataInfo.minDate ?? null;
  }
}

/**
 * Clase para la definiciÃ³n de la informaciÃ³n de la columna de tipo boolean
 */
export class ImperiaTableColumnDataBoolean extends ImperiaTableColumnDataInfo {
  type: 'boolean' = 'boolean';
  trueValue: any;
  falseValue: any;
  trueLabel: string;
  falseLabel: string;
  /**
   * asigna las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo boolean
   * @param dataInfo Las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo boolean
   * @param dataInfo.trueValue Indica el valor que se asigna cuando el campo es verdadero
   * @param dataInfo.falseValue Indica el valor que se asigna cuando el campo es falso
   * @param dataInfo.defaultValue Indica el valor por defecto del campo
   * @param dataInfo.editing Indica si el campo es editable
   * @param dataInfo.editingColWidth Indica el ancho de la columna en modo ediciÃ³n
   * @param dataInfo.readonly Indica si el campo es de solo lectura
   * @param dataInfo.formValidations Indica las validaciones del campo
   * @param dataInfo.formValidations.validators Indica las validaciones del campo
   * @param dataInfo.formValidations.asyncValidators Indica las validaciones asÃ­ncronas del campo
   */
  constructor(dataInfo: IImperiaTableColumnDataBoolean) {
    super({
      ...dataInfo,
      defaultValue: dataInfo.defaultValue ?? dataInfo.falseValue ?? 0,
    });
    this.trueValue = dataInfo.trueValue ?? 1;
    this.falseValue = dataInfo.falseValue ?? 0;
    this.trueLabel = dataInfo.trueLabel ?? 'SÃ­';
    this.falseLabel = dataInfo.falseLabel ?? 'No';
    this.defaultValue = dataInfo.defaultValue ?? this.falseValue;
  }
}
/**
 * Clase para la definiciÃ³n de la informaciÃ³n de la columna de tipo select
 */
export class ImperiaTableColumnDataSelect<
  TSelectItem extends object = any
> extends ImperiaTableColumnDataInfo {
  type: 'select' = 'select';
  options: TSelectItem[];
  keyProperty: string;
  labelProperty: string;
  translationKey: string;
  disabledProperty: string;
  required: boolean | undefined;
  overlayOpen: Subject<boolean> = new Subject<boolean>();
  /**
   * asigna las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo select
   * @param dataInfo Las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo select
   * @param dataInfo.options Indica las opciones del campo
   * @param dataInfo.keyProperty Indica la propiedad que se asigna al valor del campo
   * @param dataInfo.labelProperty Indica la propiedad que se asigna al label del campo
   * @param dataInfo.translationKey Indica la llave de traducciÃ³n del campo
   * @param dataInfo.editing Indica si el campo es editable
   * @param dataInfo.editingColWidth Indica el ancho de la columna en modo ediciÃ³n
   * @param dataInfo.readonly Indica si el campo es de solo lectura
   * @param dataInfo.formValidations Indica las validaciones del campo
   * @param dataInfo.formValidations.validators Indica las validaciones del campo
   * @param dataInfo.formValidations.asyncValidators Indica las validaciones asÃ­ncronas del campo
   */
  constructor(dataInfo: IImperiaTableColumnDataSelect<TSelectItem>) {
    super({ ...dataInfo, defaultValue: dataInfo.defaultValue ?? null });
    this.options = dataInfo.options || [];
    this.keyProperty = dataInfo.keyProperty || 'Id';
    this.labelProperty = dataInfo.labelProperty || 'Id';
    this.translationKey = dataInfo.translationKey || '';
    this.placeholder = dataInfo.placeholder || '';
    this.disabledProperty = dataInfo.disabledProperty || '';
    this.required = dataInfo.required || false;
  }
}
/**
 * Clase para la definiciÃ³n de la informaciÃ³n de la columna de tipo table
 */
export class ImperiaTableColumnDataTable<
  TTableItem extends object = any,
  TTableItemDataKey extends keyof TTableItem = any,
  TTableItemDataLabel extends keyof TTableItem = any
> extends ImperiaTableColumnDataInfo {
  type: 'table' = 'table';
  endpoint: { url: string; hasFilters: boolean; body?: any; loaded: boolean };
  valueMapper: (data: any, translation: TCompleteTranslation) => TTableItem[];
  value: TTableItem[];
  columnsProperties: TImperiaTableColumnProperties<TTableItem>[];
  columns: ImperiaTableColumn<TTableItem>[];
  dataKey: TTableItemDataKey | TTableItemDataKey[];
  dataLabel: TTableItemDataLabel;
  fullData: boolean;
  selectionMode: 'single' | 'multiple';
  pageSize: number;
  allowDelete: boolean;
  scrollEvents: boolean;
  translationKey: keyof TCompleteTranslation;
  overlayOpen: Subject<boolean> = new Subject<boolean>();
  /**
   * asigna las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo table
   * @param dataInfo Las propiedades minimas para la definiciÃ³n de la informaciÃ³n de la columna de tipo table
   * @param dataInfo.endpoint Indica la informaciÃ³n del endpoint
   * @param dataInfo.endpoint.url Indica la url del endpoint
   * @param dataInfo.endpoint.hasFilters Indica si el endpoint tiene filtros
   * @param dataInfo.endpoint.body Indica el body del endpoint
   * @param dataInfo.endpoint.loaded Indica si el endpoint ya fue cargado
   * @param dataInfo.value Indica el valor del campo
   * @param dataInfo.columns Indica las columnas de la tabla
   * @param dataInfo.columnsProperties Indica las propiedades de las columnas de la tabla
   * @param dataInfo.dataKey Indica la propiedad que se asigna al valor del campo
   * @param dataInfo.dataLabel Indica la propiedad que se asigna al label del campo
   * @param dataInfo.editing Indica si el campo es editable
   * @param dataInfo.editingColWidth Indica el ancho de la columna en modo ediciÃ³n
   * @param dataInfo.readonly Indica si el campo es de solo lectura
   * @param dataInfo.formValidations Indica las validaciones del campo
   * @param dataInfo.formValidations.validators Indica las validaciones del campo
   * @param dataInfo.formValidations.asyncValidators Indica las validaciones asÃ­ncronas del campo
   * @param dataInfo.valueMapper Indica el mapeo de los datos del endpoint
   * @param dataInfo.fullData Indica si al seleccionar un valor, se devuelve el objeto completo o solo la propiedad indicada en dataKey
   * @param dataInfo.selectionMode Indica el modo de selecciÃ³n de la tabla
   * @param dataInfo.pageSize Indica el tamaÃ±o de la pÃ¡gina de la tabla
   * @param dataInfo.scrollEvents Indica si se deben cargar los datos de la tabla al hacer scroll
   * @param dataInfo.translationKey Indica la llave de traducciÃ³n del campo
   * @param dataInfo.overlayOpen Indica si el overlay de la tabla estÃ¡ abierto
   */
  constructor(
    dataInfo: IImperiaTableColumnDataTable<
      TTableItem,
      TTableItemDataKey,
      TTableItemDataLabel
    >
  ) {
    super({ ...dataInfo, defaultValue: dataInfo.defaultValue ?? null });
    this.endpoint = {
      url: dataInfo.endpoint?.url || '',
      hasFilters: dataInfo.endpoint.hasFilters ?? false,
      body:
        dataInfo.endpoint.body === undefined
          ? dataInfo.endpoint.hasFilters
            ? {}
            : ''
          : dataInfo.endpoint.body,
      loaded: dataInfo.endpoint.loaded ?? false,
    };
    this.value = dataInfo.value ?? [];
    this.columns = dataInfo.columns ?? [];
    this.columnsProperties = dataInfo.columnsProperties || [];
    this.dataKey = dataInfo.dataKey || ('Id' as any);
    this.dataLabel = dataInfo.dataLabel || ('Id' as any);
    this.fullData = dataInfo.fullData ?? false;
    this.selectionMode = dataInfo.selectionMode || 'single';
    this.pageSize = dataInfo.pageSize || 100;
    this.allowDelete = dataInfo.allowDelete ?? true;
    this.scrollEvents = dataInfo.scrollEvents ?? this.endpoint.hasFilters;
    this.valueMapper = dataInfo.valueMapper ?? ((data: any): any[] => data);
    this.translationKey = dataInfo.translationKey || ('' as any);
  }
}

export class ImperiaTableRegisterName {
  singular: string;
  plural: string;
  gender: 'm' | 'f';
  constructor(newRegisterName: TImperiaTableRegisterName) {
    this.singular = newRegisterName.singular;
    this.plural = newRegisterName.plural;
    switch (newRegisterName.gender) {
      case 'm':
        this.gender = 'm';
        break;
      case 'f':
        this.gender = 'f';
        break;

      default:
        this.gender = 'm';
        break;
    }
  }
}
