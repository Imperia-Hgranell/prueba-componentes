import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DEFAULT_SCROLL_HEIGHT } from '../imperia-table/imperia-table.component';
import { ImperiaTableColumn } from '../../models/imperia-table-columns.models';
import { TImperiaTableColumnField } from '../../models/imperia-table-columns.types';
import { ImperiaTableFilterValue } from '../../models/imperia-table-filters.models';
import { getFiltersFromStorage } from '../../shared/functions';
import { FilterOperator } from '@imperiascm/scp-utils/payload';
import { ImpTranslateService } from '@imperiascm/translate';
import dayjs from 'dayjs/esm';
import { Dropdown } from 'primeng/dropdown';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  tap,
  withLatestFrom,
} from 'rxjs';
/**
 * @deprecated
 */
@Component({
  selector: 'imperia-table-filter',
  templateUrl: './imperia-table-filter.component.html',
  styleUrls: [
    './imperia-table-filter.component.scss',
    '../imperia-table/imperia-table.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableFilterComponent<TItem extends object> {
  //#region TRANSLATIONS
  public readonly TRANSLATIONS =
    this.typedTranslateService.translation.IMPERIA_TABLE.headers;
  //#endregion TRANSLATIONS

  //#region INPUTS
  @Input() scrollHeight: string = DEFAULT_SCROLL_HEIGHT;
  //#endregion INPUTS

  //#region OPENED
  @Input() opened: boolean = false;
  @Output() openedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  //#endregion OPENED

  //#region CLOSED_BY_USER
  private closedByUser$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  @Input('closedByUser') set reloadSetter(v: boolean) {
    this.closedByUser$.next(v);
  }
  //#endregion CLOSED_BY_USER

  //#region COLUMNS
  @Input('columns') set columnsSetter(v: ImperiaTableColumn<TItem>[]) {
    this.columns.next(v);
  }
  private columns: ReplaySubject<ImperiaTableColumn<TItem>[]> =
    new ReplaySubject<ImperiaTableColumn<TItem>[]>(1);

  private columns$: Observable<ImperiaTableColumn<TItem>[]> = this.columns.pipe(
    map((columns) => columns.filter(({ allowFilter }) => allowFilter)),
    tap((columns) =>
      columns.forEach((col) => this.allColumns.set(col.filterName, col))
    ),
    shareReplay(1)
  );
  private allColumns: Map<
    string | TImperiaTableColumnField<TItem>,
    ImperiaTableColumn<TItem>
  > = new Map<
    string | TImperiaTableColumnField<TItem>,
    ImperiaTableColumn<TItem>
  >();
  //#endregion COLUMNS

  //#region SELECTED FILTERS
  private storageKey: string | undefined;
  @Input('storageKey') set storageKeySetter(key: string | undefined) {
    this.storageKey = key;
    if (!key) return;
    this.selectedFilters.next(getFiltersFromStorage(key));
  }
  /**
   * @description Array de filtros seleccionados, en la propiedad `Column` esta la columna a la que hace referencia el filtro
   * si no se encuentra la columna en el array de columnas, no se aplicara el filtro
   */
  @Input('selectedFilters') set selectedFiltersSetter(
    v: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[]
  ) {
    this.syncNewSelectedFiltersWithModifications(v);
    this.selectedFilters.next(v);
  }
  /**
   * @description Array de filtros seleccionados, en la propiedad `Column` esta el `field` de la columna a la que hace referencia el filtro
   */
  private selectedFilters: BehaviorSubject<
    ImperiaTableFilterValue<TItem, string | TImperiaTableColumnField<TItem>>[]
  > = new BehaviorSubject<
    ImperiaTableFilterValue<TItem, string | TImperiaTableColumnField<TItem>>[]
  >([]);
  private selectedFiltersModifications: ImperiaTableFilterValue<
    TItem,
    string | TImperiaTableColumnField<TItem>
  >[] = [];
  //#endregion SELECTED FILTERS

  //#region ADD FILTER
  public addFilter = (
    colToAdd: ImperiaTableColumn<TItem>,
    selectedFilters: ImperiaTableFilterValue<
      TItem,
      ImperiaTableColumn<TItem>
    >[],
    dropdown: Dropdown
  ) => {
    dropdown.hide();
    dropdown.resetFilter();
    this.dropdownToSelectNewFilterVisible = false;
    this.setColFilterFormValues(colToAdd);
    this.setFormControlToFilters(colToAdd);
    const newSelectedFilters = selectedFilters
      .map((filter) => filter.Column.toFilterString())
      .concat([colToAdd.toFilterString()]);
    this.selectedFilters.next(newSelectedFilters);
  };
  private setColFilterFormValues = (col: ImperiaTableColumn<TItem>) => {
    const { operator, value } = col.filterForm.controls;
    if (col.dataInfo.type === 'boolean') {
      col.setFilterValues(col.dataInfo.defaultValue, operator.value);
    } else if (col.dataInfo.type === 'date') {
      col.setFilterValues(
        !!value.value ? new Date(value.value) : null,
        operator.value
      );
    } else {
      col.setFilterValues(value.value, operator.value);
    }
  };
  private setFormControlToFilters = (col: ImperiaTableColumn<TItem>) => {
    this.columnsFiltersFormGroup.setControl(
      col.filterName + '_value',
      col.filterForm.controls['value'],
      {
        emitEvent: false,
      }
    );
    this.columnsFiltersFormGroup.setControl(
      col.filterName + '_operator',
      col.filterForm.controls['operator'],
      {
        emitEvent: false,
      }
    );
  };
  //#endregion ADD FILTER

  //#region REMOVE FILTER
  public removeFilterFn = (
    filterToRemove: ImperiaTableFilterValue<TItem>,
    selectedFilters: ImperiaTableFilterValue<TItem>[]
  ) => {
    this.removeFormControlForThisCol(filterToRemove.Column);
    const newSelectedFilters = selectedFilters
      .map((filter) => filter.Column.toFilterString())
      .filter((filter) => filter.Column !== filterToRemove.Column.filterName);
    this.selectedFilters.next(newSelectedFilters);
  };
  private removeFormControlForThisCol = (col: ImperiaTableColumn<TItem>) => {
    col.setFilterValues(null, FilterOperator.EQUAL);
    this.columnsFiltersFormGroup.removeControl(col.filterName + '_value', {
      emitEvent: false,
    });
    this.columnsFiltersFormGroup.removeControl(col.filterName + '_operator', {
      emitEvent: false,
    });
  };
  //#endregion REMOVE FILTER

  //#region FILTERS
  public filters$ = combineLatest([this.selectedFilters, this.columns$]).pipe(
    map(([selected, columns]) => ({
      selected: this.mergeWithModifications(selected),
      columns,
    })),
    map(({ selected, columns }) => ({
      columns,
      ...selected.reduce(
        ({ selected, selectedInAllColumns }, selectedFilterString) => {
          const { col, wasInAllColumns } =
            this.findColumnForThisFilter(selectedFilterString);
          this.setFormControlToFilters(col);
          if (!wasInAllColumns)
            return {
              selected: selected.concat([col.toFilter()]),
              selectedInAllColumns,
            };
          return {
            selected: selected.concat([col.toFilter()]),
            selectedInAllColumns: selectedInAllColumns.concat([col.toFilter()]),
          };
        },
        {
          selected: [] as ImperiaTableFilterValue<TItem>[],
          selectedInAllColumns: [] as ImperiaTableFilterValue<TItem>[],
        }
      ),
    })),
    map(({ columns, selected, selectedInAllColumns }) => ({
      columns,
      selected,
      selectedInAllColumns,
      unselected: columns.filter(
        (col) =>
          !selectedInAllColumns.some(
            (selected) => selected.Column.filterName === col.filterName
          )
      ),
    })),
    tap(() => this.columnsFiltersFormGroup.updateValueAndValidity())
  );
  @Output() onFilter: EventEmitter<
    ImperiaTableFilterValue<TItem, string | TImperiaTableColumnField<TItem>>[]
  > = new EventEmitter<
    ImperiaTableFilterValue<TItem, string | TImperiaTableColumnField<TItem>>[]
  >();
  //#endregion FILTERS

  //#region FILTERS FORM GROUP
  private columnsFiltersFormGroup = new FormGroup({});
  public filtersFormGroupChanges$ =
    this.columnsFiltersFormGroup.valueChanges.pipe(
      debounceTime(300),
      map((value) => this.mergeFilterValuesAndOperatorsToArray(value)),
      tap((value) => this.updateSelectedFiltersModifications(value)),
      map((value) => this.datesToISOString(value)),
      tap((value) => this.saveFiltersToStorage(value)),
      withLatestFrom(this.columns$),
      map(([value, columns]) => {
        if (columns.length === 0) return value;
        const columnsFilterNames = columns.map((col) => col.filterName);
        return value.filter((filter) =>
          columnsFilterNames.includes(filter.Column)
        );
      }),
      map((value) => this.removeEmptyFilters(value)),
      tap((value) => this.checkIfShouldOpenFilterPanel(value)),
      distinctUntilChanged((prev, curr) =>
        this.checkIfFiltersChanged(prev, curr)
      ),
      map((value) => this.convertFilterValuesToString(value)),
      tap((value) => this.onFilter.emit(value))
    );
  //#endregion FILTERS FORM GROUP

  //#region DROPDOWN TO ADD NEW FILTER
  public dropdownToSelectNewFilterVisible: boolean = false;
  public dropdownToSelectNewFilterValue: ImperiaTableColumn<TItem> | null =
    null;
  public showDropdownToSelectNewFilter = (dropdown: Dropdown): void => {
    this.dropdownToSelectNewFilterVisible = true;
    dropdown.show();
    dropdown.focus();
  };
  //#endregion DROPDOWN TO ADD NEW FILTER

  constructor(public typedTranslateService: ImpTranslateService) {}

  public onPaste(event: ClipboardEvent, column: ImperiaTableColumn<any>) {
    event.preventDefault();
    const { clipboardData } = event;
    if (!clipboardData) return;
    const text = clipboardData.getData('text');
    if (!text) return;
    const textWithCommas = text.split(/[\r\n]+/g).join(';');
    column.setFilterValues(textWithCommas, FilterOperator.EQUAL);
  }

  private mergeWithModifications(
    selectedFilters: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[]
  ) {
    if (!this.selectedFiltersModifications.length) return selectedFilters;
    return selectedFilters.map((selectedFilter) => {
      const modifiedFilter = this.selectedFiltersModifications.find(
        ({ Column }) => Column === selectedFilter.Column
      );
      if (!modifiedFilter) return selectedFilter;
      return modifiedFilter;
    });
  }

  private syncNewSelectedFiltersWithModifications(
    selectedFilters: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[]
  ) {
    this.selectedFiltersModifications = this.selectedFiltersModifications.map(
      (filterWithModifications) => {
        const selectedFilter = selectedFilters.find(
          ({ Column }) => Column === filterWithModifications.Column
        );
        if (selectedFilter) return selectedFilter;
        return filterWithModifications;
      }
    );
  }

  /**
   * Esta funciÃ³n convierte los filtros con la propiedad Column como string a la propiedad Column como ImperiaTableColumn
   * @param filterString Filtro con la propiedad Column como string
   * @param columns Todos los filtros posibles
   * @returns El filtro con la propiedad Column como ImperiaTableColumn o undefined si no se encuentra
   */
  private findColumnForThisFilter(
    filterString: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >
  ): { col: ImperiaTableColumn<TItem>; wasInAllColumns: boolean } {
    const col = this.allColumns.get(filterString.Column);
    if (col) {
      const value =
        col.dataInfo.type === 'date'
          ? !!filterString.Value
            ? new Date(filterString.Value as string)
            : null
          : filterString.Value;
      col.setFilterValues(value, filterString.Operator);
      return { col, wasInAllColumns: true };
    }
    const tempCol = new ImperiaTableColumn<TItem>(
      filterString.Column as TImperiaTableColumnField<TItem>,
      { type: 'string' },
      '',
      100
    );
    tempCol.setFilterValues(filterString.Value, filterString.Operator);
    return { col: tempCol, wasInAllColumns: false };
  }

  private mergeFilterValuesAndOperatorsToArray(filters: {
    [key: string]: any;
  }): ImperiaTableFilterValue<
    TItem,
    string | TImperiaTableColumnField<TItem>
  >[] {
    const newFilters: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[] = [];
    for (const key in filters) {
      if (key.endsWith('_value')) {
        const filterName = key.replace('_value', '');
        const operator = filters[filterName + '_operator'];
        const value = filters[key];
        newFilters.push({
          Column: filterName,
          Operator: operator,
          Value: value,
        });
      }
    }
    return newFilters;
  }

  private removeEmptyFilters(
    filters: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[]
  ): ImperiaTableFilterValue<
    TItem,
    string | TImperiaTableColumnField<TItem>
  >[] {
    return filters.filter((f) => {
      const valueOrOperator: any[] = [f.Value, f.Operator];
      if (Array.isArray(f.Value) && f.Value.length === 0) return false;
      if (valueOrOperator.includes(null)) return false;
      if (valueOrOperator.includes(undefined)) return false;
      if (valueOrOperator.includes('null')) return false;
      if (valueOrOperator.includes('undefined')) return false;
      if (valueOrOperator.includes('')) return false;
      return true;
    });
  }

  private updateSelectedFiltersModifications(
    modifications: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[]
  ) {
    this.selectedFiltersModifications = modifications;
  }

  public onCloseFilters() {
    this.openedChange.emit(false);
    this.closedByUser$.next(true);
  }

  private checkIfShouldOpenFilterPanel(
    filters: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[]
  ) {
    if (!this.allColumns.size) return;
    if (!filters.length) return;
    if (this.closedByUser$.value) return;
    this.openedChange.emit(true);
  }

  private checkIfFiltersChanged(
    prevFilters: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[],
    currFilters: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[]
  ) {
    return JSON.stringify(prevFilters) === JSON.stringify(currFilters);
  }

  private saveFiltersToStorage(
    filters: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[]
  ) {
    if (!this.storageKey) return;
    localStorage.setItem(this.storageKey + '_filters', JSON.stringify(filters));
  }

  private datesToISOString(
    filters: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[]
  ) {
    return filters.map((filter) => {
      const col = this.allColumns.get(filter.Column);
      if (!col) return filter;
      if (col.dataInfo.type != 'date') return filter;
      if (!filter.Value) return filter;
      filter.Value = dayjs(filter.Value as string).format('YYYY/MM/DD');
      return filter;
    });
  }

  private convertFilterValuesToString(
    filters: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[]
  ): ImperiaTableFilterValue<
    TItem,
    string | TImperiaTableColumnField<TItem>
  >[] {
    return filters.map((filter) => ({
      ...filter,
      Value: filter.Value + '',
    }));
  }
}
