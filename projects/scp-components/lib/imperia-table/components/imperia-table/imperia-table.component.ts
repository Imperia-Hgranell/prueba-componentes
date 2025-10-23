import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  CdkVirtualScrollViewport,
  FixedSizeVirtualScrollStrategy,
  VIRTUAL_SCROLL_STRATEGY,
} from '@angular/cdk/scrolling';
import { CdkCell, CdkHeaderCell } from '@angular/cdk/table';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ImpColumnsGroupTemplateDirective } from '../../directives/imp-columns-group-template.directive';
import { ImperiaTableColumnsGroup } from '../../models/imperia-table-columns-groups.models';
import {
  ImperiaTableColumn,
  ImperiaTableColumnDataInfo,
  ImperiaTableRegisterName,
} from '../../models/imperia-table-columns.models';
import {
  IImperiaTableColumnDataBoolean,
  TImperiaTableColumnDataInfoTypes,
  TImperiaTableColumnField,
  TImperiaTableRegisterName,
} from '../../models/imperia-table-columns.types';
import { ImperiaTableFilterValue } from '../../models/imperia-table-filters.models';
import {
  ImperiaTableCellClickEvent,
  ImperiaTableCellSaveEvent,
  ImperiaTableColumnResizeEvent,
  ImperiaTableDeleteEvent,
  ImperiaTableFilterSortScrollEvent,
  ImperiaTableHorizontalScrollValue,
  ImperiaTableRowAddEvent,
  ImperiaTableRowClickEvent,
  ImperiaTableRowReorderEvent,
  ImperiaTableScrollValue,
  ImperiaTableSortValue,
  SetDataSyncFn,
} from '../../models/imperia-table-outputs.models';
import {
  ImperiaTableDataSource,
  ImperiaTableRow,
} from '../../models/imperia-table-rows.models';
import {
  ImperiaTableAddRowDialogVM,
  ImperiaTableVM,
} from '../../models/imperia-table-view.models';
import {
  getFiltersFromStorage,
  getSortFromStorage,
  setSortToStorage,
} from '../../shared/functions';
import { ImpOverlayService } from '@imperiascm/scp-utils/overlay';
import { createHash, LOCALE, UTC } from '@imperiascm/scp-utils/functions';
import { FilterOperator } from '@imperiascm/scp-utils/payload';
import { Sort } from '@imperiascm/scp-utils/payload';
import moment from 'moment';
import { OverlayPanel } from 'primeng/overlaypanel';
import {
  BehaviorSubject,
  buffer,
  bufferCount,
  combineLatest,
  combineLatestWith,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  first,
  interval,
  map,
  mergeWith,
  Observable,
  of,
  race,
  repeat,
  ReplaySubject,
  shareReplay,
  startWith,
  Subject,
  Subscription,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ImpTranslateService } from '@imperiascm/translate';
import { ImpCrudMessagesComponent } from '../../../imp-data-sync/imp-data-sync.component';
import { ImperiaFormDataSyncState } from '../../../imperia-form/models/imperia-form.types';
import {
  CellEditTemplateDirective,
  ImperiaTableCellEditTemplateContext,
} from '../../directives/cell-edit-template.directive';
import { ImpColumnCellTemplateDirective } from '../../directives/imp-column-cell-template.directive';
import { ResizeColumnEvent } from '../../directives/resize-column.directive';
import { ImperiaTableCellEditEvent } from '../../models/imperia-table-editing.models';
import { FOOTER_ROW_INDEX } from '../../models/imperia-table-footer.constants';

export class CustomVirtualScrollStrategy extends FixedSizeVirtualScrollStrategy {
  constructor() {
    super(34, 0, 0);
  }

  override attach(viewport: CdkVirtualScrollViewport): void {
    this.onDataLengthChanged();
  }
}

/**
 * Por defecto la altura de la tabla es el 100% de la pantalla menos
 * el alto del header, el menu y el caption de la propia tabla juntos
 */
export const DEFAULT_SCROLL_HEIGHT = 'calc(100vh - 163px)';
/**
 * @deprecated
 */
@Component({
  selector: 'imperia-table',
  templateUrl: './imperia-table.component.html',
  styleUrls: ['./imperia-table.component.scss'],
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useClass: CustomVirtualScrollStrategy,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableComponent<TItem extends object>
  implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
  public LOCALE = LOCALE();

  //#region TRANSLATIONS
  public readonly HEADER_TRANSLATIONS =
    this.typedTranslateService.translation.IMPERIA_TABLE.headers;
  public readonly CAPTION_TRANSLATIONS =
    this.typedTranslateService.translation.IMPERIA_TABLE.caption;
  public readonly EXCEL_LIKE_TABLE_TRANSLATIONS =
    this.typedTranslateService.translation.EXCEL_LIKE.table;
  //#endregion TRANSLATIONS

  //#region HEADER OVERLAY PANEL
  @ViewChild('op') headerOverlayPanel!: OverlayPanel;
  @Input() disableSorting: boolean = false;
  @Output('onSort')
  public onSortEmitter: EventEmitter<ImperiaTableFilterSortScrollEvent<TItem>> =
    new EventEmitter<ImperiaTableFilterSortScrollEvent<TItem>>();
  public colHeaderSelected!: ImperiaTableColumn<TItem>;
  public sortTypes = Sort;
  public toggleHeaderOverlayPanel = (
    col: ImperiaTableColumn<TItem>,
    event: any
  ) => {
    event.preventDefault();
    if (
      (this.disableFilters && this.disableSorting) ||
      (!col.allowFilter && !col.sortable) ||
      col.resizing ||
      this.hideFilterIcon
    ) {
      return;
    }
    this.colHeaderSelected = col;
    this.headerOverlayPanel.toggle(event);
  };
  //#endregion HEADER OVERLAY PANEL

  //#region ROW OVERLAY PANEL
  @ViewChild('opRow') rowOverlayPanel!: OverlayPanel;
  public overlayPanelRowSelectedInfo!: {
    cdkCell: CdkCell;
    row: ImperiaTableRow<TItem>;
    event: MouseEvent;
  };
  public toggleRowOverlayPanel = (
    cdkCell: CdkCell,
    row: ImperiaTableRow<TItem>,
    event: MouseEvent
  ) => {
    event.preventDefault();
    this.overlayPanelRowSelectedInfo = { row, cdkCell, event };
    this.rowOverlayPanel.toggle(event);
  };
  public onCopy = () => {
    const { event, cdkCell } = this.overlayPanelRowSelectedInfo;
    if (!event.target) return;
    const rowElement: HTMLElement = this.renderer.parentNode(cdkCell);
    if (!rowElement) return;
    const rowCellStrings: string[] = [];
    for (let i = 0; i < rowElement.children.length; i++) {
      const { ELEMENT_NODE, nodeType, innerText } = rowElement.children[
        i
      ] as HTMLElement;
      if (ELEMENT_NODE === nodeType) {
        rowCellStrings.push(innerText);
      }
    }
    const copyThis = rowCellStrings.join('\t');
    this.clipboard.copy(copyThis);
    this.rowOverlayPanel.toggle(event);
  };
  //#endregion ROW OVERLAY PANEL

  //#region TABLE CAPTION
  @Input() title: string = '';
  @Input() showTitle: boolean = true;
  @Input('registerName') set registerNameSetter(
    newRegisterName: TImperiaTableRegisterName
  ) {
    this.registerName = new ImperiaTableRegisterName(newRegisterName);
  }
  @Input() excelButtonLoading = false;
  @Input() hasExportExcel: boolean = false;
  public registerName: ImperiaTableRegisterName = {
    singular: '',
    plural: '',
    gender: 'm',
  };
  get captionVisibility(): boolean {
    return (
      ((!!this.registerName.singular || !!this.title) && this.showTitle) ||
      !this.disableFilters ||
      (this.enableSelection && this.enableToggleSelectionMode) ||
      this.enableAddRow ||
      this.enableCellEditing ||
      this.enableDelete ||
      !this.disableBookmark
    );
  }
  @Output('captionVisibility') captionVisibilityEmitter: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  //#endregion TABLE CAPTION

  //#region FOCUS HANDLING
  onFocusChange = (event: string | null) => (this.isFocused = !!event);
  private isFocused: boolean = false;
  //#endregion FOCUS HANDLING

  //#region COLUMN SCROLL INTO VIEW
  @ViewChildren(CdkHeaderCell, { read: ElementRef<HTMLDivElement> })
  set headerCellsSetter(v: QueryList<ElementRef<HTMLDivElement>>) {
    this.headerCells.next(v.toArray());
  }
  private headerCells: ReplaySubject<ElementRef<HTMLDivElement>[]> =
    new ReplaySubject<ElementRef<HTMLDivElement>[]>(1);
  @Input('scrollToColumn') set scrollToColumnSetter(
    v: TImperiaTableColumnField<TItem> | null
  ) {
    if (!v) this.resetColumnFocused.next();
    else this.columnFieldToFocus.next(v);
  }
  @Output('onBlurScrolledColumn') onBlurScrolledColumnEmitter: EventEmitter<
    TImperiaTableColumnField<TItem>
  > = new EventEmitter<TImperiaTableColumnField<TItem>>();
  private blurScrolledColumnTimeout: ReturnType<typeof setTimeout> | undefined;
  private columnFieldToFocus: ReplaySubject<TImperiaTableColumnField<TItem>> =
    new ReplaySubject<TImperiaTableColumnField<TItem>>(1);
  private resetColumnFocused: Subject<void> = new Subject<void>();
  public focusedColumnField$ = this.columnFieldToFocus.pipe(
    withLatestFrom(this.headerCells),
    map(([columnFieldToFocus, headerCells]) => ({
      columnFieldToFocus,
      headerCell: headerCells.find(({ nativeElement }) =>
        nativeElement.classList.contains(
          `cdk-column-${columnFieldToFocus.replace(/:/g, '-')}`
        )
      ),
    })),
    filter(({ headerCell }) => !!headerCell),
    map(({ headerCell, ...event }) => ({
      ...event,
      headerCell: headerCell!,
    })),
    tap(({ headerCell: { nativeElement } }) =>
      nativeElement.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: 'smooth',
      })
    ),
    map(({ columnFieldToFocus }) => columnFieldToFocus),
    tap((columnFieldToFocus) => {
      clearTimeout(this.blurScrolledColumnTimeout);
      this.blurScrolledColumnTimeout = setTimeout(
        () => this.onBlurScrolledColumnEmitter.next(columnFieldToFocus),
        2000
      );
    }),
    mergeWith(this.resetColumnFocused.pipe(map(() => null)))
  );
  //#endregion COLUMN SCROLL INTO VIEW

  //#region SEARCH BAR
  @Input() hideSearch: boolean = false;
  @Input() allowSearch: boolean = false;
  @Input() isFrontSearcher: boolean = false;
  public searchBarOpened: boolean = false;
  public searchBarValue: Subject<string> = new Subject<string>();
  private lastSearchValue: string = '';
  public searchBarValue$ = this.searchBarValue.pipe(
    debounceTime(1000),
    distinctUntilChanged(),
    tap((searchValue) => {
      this.lastSearchValue = searchValue;
      this.lastScrollValue = {
        Page: 1,
        Size: this.lastScrollValue.Size,
      };
      if (!this.isFrontSearcher) {
        this.onSearchEmitter.emit({
          Order: this.lastSortValue,
          Filters: this.lastFilterValues,
          Pagination: this.lastScrollValue,
          Search: this.lastSearchValue,
        });
      } else {
        const filteredData = this.rows.filter((row) =>
          Object.values(row.data)
            .join(';')
            .toLowerCase()
            .includes(searchValue.toLowerCase())
        );
        this.dataSource.updateRows(filteredData);
      }
    })
  );
  @Output('onSearch')
  public onSearchEmitter: EventEmitter<
    ImperiaTableFilterSortScrollEvent<TItem>
  > = new EventEmitter<ImperiaTableFilterSortScrollEvent<TItem>>();
  public toggleSearchBar = (searchBar: HTMLInputElement) => {
    this.searchBarOpened = !this.searchBarOpened;
    if (this.searchBarOpened) {
      setTimeout(() => searchBar.focus(), 100);
    }
  };
  //#endregion SEARCH BAR

  //#region ROW ADD
  @Input() enableAddRow: boolean = false;
  @Output('onClickAddButton')
  onClickAddButtonEmitter: EventEmitter<void> = new EventEmitter<void>();
  @Input() addingRowActive: boolean = false;
  @Input() modalToAddRowVisible: boolean = false;
  @Output('onRowAdd') onRowAddEmitter: EventEmitter<ImperiaTableRowAddEvent> =
    new EventEmitter<ImperiaTableRowAddEvent>();
  @Output('addingRowActiveChange')
  addingRowActiveEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output('modalToAddRowVisibleChange')
  modalToAddRowVisibleEmitter: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  public form: FormGroup = new FormGroup({});
  private formDefaultValues: { [k in TImperiaTableColumnField<TItem>]?: any } =
    {};
  public startAddingRow = (): void => {
    this.onClickAddButtonEmitter.emit();
    this.form.patchValue(this.formDefaultValues, { emitEvent: false });
    if (this.useDefaultModalToAddRow) {
      this.addingRowActive = true;
      this.addingRowActiveEmitter.emit(true);
      this.modalToAddRowVisible = true;
      this.modalToAddRowVisibleEmitter.emit(true);
    }
  };
  public stopAddingRow = (): void => {
    this.form.patchValue(this.formDefaultValues, { emitEvent: false });
    this.addingRowActive = false;
    this.addingRowActiveEmitter.emit(false);
    this.modalToAddRowVisible = false;
    this.modalToAddRowVisibleEmitter.emit(false);
  };
  public saveRowAdding = () => {
    if (this.form.invalid) {
      this.setDataSyncState('add', 'error', false);
      return;
    }
    this.dataSyncState.next('saving');
    this.onRowAddEmitter.emit({
      form: this.form,
      setDataSyncState: this.setDataSyncState,
    });
    if (this.useDefaultModalToAddRow) {
      this.addingRowActive = false;
      this.addingRowActiveEmitter.emit(this.addingRowActive);
      this.modalToAddRowVisible = false;
      this.modalToAddRowVisibleEmitter.emit(this.modalToAddRowVisible);
    }
  };
  //#endregion ROW ADD

  //#region CELL EDIT
  @Input() enableCellEditing: boolean = false;
  @Input('cellEditingState') set cellEditingStateSetter(newState: boolean) {
    this.cellEditingState.next(newState);
  }
  public cellEditingState: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public toggleCellEditingState = (currentState: boolean) => {
    this.cellEditingState.next(!currentState);
    this.cellEditingStateEmitter.emit(!currentState);
  };
  @Output('cellEditingStateChange')
  cellEditingStateEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output('onCellSave') onCellSaveEmitter: EventEmitter<
    ImperiaTableCellSaveEvent<TItem>
  > = new EventEmitter<ImperiaTableCellSaveEvent<TItem>>();
  public editingCellInfo: ImperiaTableCellEditEvent<TItem> | undefined;
  public readonly CELL_EDIT_TEMPLATES_MAP: {
    [K in TImperiaTableColumnDataInfoTypes]?: TemplateRef<ImperiaTableCellEditTemplateContext>;
  } = {};

  @ViewChildren(CellEditTemplateDirective)
  set cellEditTemplatesSetter(query: QueryList<CellEditTemplateDirective>) {
    query.forEach(
      ({ template, type }) => (this.CELL_EDIT_TEMPLATES_MAP[type] = template)
    );
  }
  public onEditEvents = (
    event: ImperiaTableCellEditEvent<TItem>,
    eventType: 'init' | 'complete' | 'cancel',
    footerVM: {
      visible: boolean;
      row: ImperiaTableRow<TItem>;
    }
  ) => {
    if (eventType === 'init' || eventType === 'cancel') return;
    const cell = event.row.cells[event.col.field];
    if (!cell.control.dirty || cell.control.invalid) return;
    this.dataSyncState.next('saving');
    this.onCellSaveEmitter.emit({
      field: event.col.field,
      isSelected: this.isSelected(event.row),
      oldItem: event.row.data,
      newItem: {
        ...event.row.data,
        [event.col.field]: cell.control.value,
      },
      oldValue: event.row.data[event.col.field],
      newValue: cell.control.value,
      control: cell.control,
      fromFooter: event.row.index == FOOTER_ROW_INDEX,
      row: event.row,
      col: event.col,
      footerRow: footerVM.visible ? footerVM.row : null,
      set: (data: Partial<TItem>) => {
        Object.assign(event.row.data, data);
        //Se actualiza el valor de la celda
        event.row.cells[event.col.field].value = data[event.col.field] ?? null;
        //Se actualiza el valor del control
        event.row.cells[event.col.field].control.setValue(
          event.row.cells[event.col.field].value,
          {
            emitEvent: false,
          }
        );
        //Se emite el evento de renderizado de la fila
        this.onRowRenderEmitter.emit(event.row);
      },
      setDataSyncState: (action, state, showMessage, detail) => {
        this.setDataSyncState(action, state);
        event.editableCellValueSyncFn(state);
        this.onRowRenderEmitter.emit(event.row);
      },
    });
  };

  //#endregion CELL EDIT

  //#region ImpCrudMessagesComponent
  public dataStatusTemplate!: TemplateRef<ImpCrudMessagesComponent<TItem>>;
  public setDataSyncState: SetDataSyncFn = () =>
    console.error(
      'setDataSyncState is not defined - Check if <imp-data-sync></imp-data-sync> is inside <imperia-table></imperia-table>'
    );
  public dataSyncState: BehaviorSubject<ImperiaFormDataSyncState> =
    new BehaviorSubject<ImperiaFormDataSyncState>('saved');
  //#endregion ImpCrudMessagesComponent

  //#region ROW DELETE
  @Input() enableDelete: boolean = false;
  @Output('onDelete') onDeleteEmitter: EventEmitter<
    ImperiaTableDeleteEvent<TItem>
  > = new EventEmitter<ImperiaTableDeleteEvent<TItem>>();
  public onDeleteSelectedItems = async () => {
    //Si la seleccion es multiple (es Array) y tiene elementos, o si la seleccion es simple (no es un Array) y no es null, podemos borrar
    const canDelete =
      (Array.isArray(this.selection) && this.selection.length > 0) ||
      (!Array.isArray(this.selection) && !!this.selection);
    if (!canDelete) return;

    //Comprobamos si queremos confirmar la eliminaciÃ³n, y si es asÃ­, mostramos el modal de confirmaciÃ³n, y si no, devolvemos true
    const confirmation = this.confirmOnDelete
      ? await this.overlayService.confirm(
          this.typedTranslateService.translation.IMPERIA_TABLE.messages
            .confirm_delete,
          {
            title:
              this.typedTranslateService.translation.IMPERIA_TABLE.messages
                .confirm_delete_title,
            hasBackdrop: false,
          }
        )
      : true;
    if (!confirmation) return;
    this.dataSyncState.next('saving');

    //Si es un array, lo devolvemos tal cual, si no, lo convertimos en array, si es null, devolvemos un array vacÃ­o
    const data = Array.isArray(this.selection)
      ? this.selection
      : !!this.selection
      ? [this.selection]
      : [];
    this.onDeleteEmitter.emit({
      data,
      result: () => {},
      setDataSyncState: this.setDataSyncState,
    });
  };
  //#endregion ROW DELETE

  //#region ROW SELECTION
  @Input() public selection: TItem[] | TItem | null = null;
  @Output('selectionChange') onSelectionChangeEmitter: EventEmitter<
    TItem[] | TItem | null
  > = new EventEmitter<TItem[] | TItem | null>();
  private setSelection = (row: ImperiaTableRow<TItem>) => {
    if (!this.enableSelection || this.showLoading) return;
    if (Array.isArray(this.selection)) {
      const index = this.selection.findIndex(
        (selectedItem) =>
          this.dataKeyValue(selectedItem) == this.dataKeyValue(row.data)
      );
      if (index == -1) {
        this.selection.push(row.data);
      } else {
        this.selection.splice(index, 1);
      }
    } else {
      this.selection = row.data;
    }
  };
  public isSelected = (row: ImperiaTableRow<TItem>) => {
    if (!this.selection) return false;
    if (Array.isArray(this.selection)) {
      return (
        this.selection.findIndex(
          (selectedItem) =>
            this.dataKeyValue(selectedItem) == this.dataKeyValue(row.data)
        ) != -1
      );
    } else {
      return this.dataKeyValue(this.selection) == this.dataKeyValue(row.data);
    }
  };
  private removeRowsFromSelectionIfNotInValue = () => {
    if (Array.isArray(this.selection)) {
      const currentSelection = this.selection;
      this.selection = this.rows
        .filter(({ data }) =>
          currentSelection.some(
            (v) => this.dataKeyValue(v) == this.dataKeyValue(data)
          )
        )
        .map(({ data }) => data);
    } else if (!!this.selection) {
      const dataKeyItemSelected = this.dataKeyValue(this.selection);
      this.selection =
        this.rows.find((v) => this.dataKeyValue(v.data) == dataKeyItemSelected)
          ?.data ?? null;
    }
    this.onSelectionChangeEmitter.emit(this.selection);
  };
  //#endregion ROW SELECTION

  //#region COLUMNS
  @Input() columns: ImperiaTableColumn<TItem>[] = [];
  public columnsGroups: ReplaySubject<ImperiaTableColumnsGroup<TItem>[]> =
    new ReplaySubject<ImperiaTableColumnsGroup<TItem>[]>(1);
  @Input('columnsGroups') set columnGroupsSetter(
    v: ImperiaTableColumnsGroup<TItem>[]
  ) {
    this.columnsGroups.next(v);
  }
  public columnsGroupsKeys: Observable<string[]> = this.columnsGroups.pipe(
    map((columnsGroups) => {
      const newStringColumnsGroups = [
        ...columnsGroups
          .filter((group) => group.frozenPosition != 'right')
          .map((group) => group.key),
        '**',
        ...columnsGroups
          .filter((group) => group.frozenPosition == 'right')
          .map((group) => group.key),
      ];
      if (this.enableRowReorder) newStringColumnsGroups.unshift('rowReorder');
      return newStringColumnsGroups;
    })
  );
  public columns$: ReplaySubject<{
    columns: ImperiaTableColumn<TItem>[];
    fields: string[];
  }> = new ReplaySubject<{
    columns: ImperiaTableColumn<TItem>[];
    fields: string[];
  }>(1);

  @Input() totalColumns: number = 0;
  @Input('horizontalPageSize') set horizontalPageSizeSetter(v: number) {
    this.horizontalPageSize = v;
  }
  public horizontalPageSize: number = 5;
  public updatingColumnsByScrolling: boolean = false;
  public colTrackByFn = (index: number, _: ImperiaTableColumn<TItem>) => index;
  //#endregion COLUMNS

  //#region VALUE/ROWS
  @Input() value: TItem[] = [];
  @Input() dataKey:
    | TImperiaTableColumnField<TItem>
    | TImperiaTableColumnField<TItem>[] =
    'Id' as TImperiaTableColumnField<TItem>;
  /**
   * El numero de pixeles de alto de cada fila para el scroll virtual
   * Es recomendable que sea el mismo que el alto de la fila en el css
   * Tambien se usa para el ancho de las celdas que son para seleccionar o reordenar filas
   */
  public rows: ImperiaTableRow<TItem>[] = [];
  @Input('pageSize') set pageSizeSetter(Size: number) {
    this.pageSize = Size;
    this.lastScrollValue = {
      ...this.lastScrollValue,
      Size,
    };
  }
  public pageSize: number = 100;
  public updatingValueByScrolling: boolean = false;
  public dataSource: ImperiaTableDataSource<ImperiaTableRow<TItem>> =
    new ImperiaTableDataSource<ImperiaTableRow<TItem>>([]);
  public rowTrackByFn = (_: number, item: ImperiaTableRow<TItem>) =>
    item.dataKeyValue;
  //#endregion VALUE/ROWS

  //#region FOOTER
  @Input('showFooterRow') set showFooterRowSetter(v: boolean) {
    this.showFooterRow.next(v);
  }
  private showFooterRow: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  private showFooterRow$: Observable<boolean> =
    this.showFooterRow.asObservable();
  @Input('footerRowData') set footerRowDataSetter(v: TItem | undefined) {
    this.footerRowData.next(v);
  }
  private footerRowData: ReplaySubject<TItem | undefined> = new ReplaySubject<
    TItem | undefined
  >(1);
  private footerRowData$: Observable<TItem | undefined> =
    this.footerRowData.asObservable();
  public footerVM$: Observable<{
    visible: boolean;
    row: ImperiaTableRow<TItem>;
  }> = combineLatest([this.footerRowData$, this.columns$]).pipe(
    //TODO: Cambiar EL this.columns por un observable que se actualice cuando se cambien las columnas
    map(
      ([data, { columns, fields }]) =>
        new ImperiaTableRow<TItem>(
          FOOTER_ROW_INDEX,
          this.dataKey,
          data ?? ({} as TItem),
          this.columns,
          true
        )
    ),
    tap((row) => this.onRowRenderEmitter.emit(row)),
    combineLatestWith(this.showFooterRow$),
    map(([row, visible]) => ({
      visible,
      row,
    })),
    shareReplay(1),
    startWith({
      visible: false,
      row: new ImperiaTableRow<TItem>(
        FOOTER_ROW_INDEX,
        this.dataKey,
        {} as TItem,
        [],
        true
      ),
    })
  );
  //#endregion FOOTER

  //#region SELECTION MODE
  public selectionMode: 'single' | 'multiple' = 'single';
  @Input('selectionMode') set selectionModeSetter(
    newSelectionMode: 'single' | 'multiple'
  ) {
    this.selectionMode = newSelectionMode;
    if (this.selectionMode == 'multiple') {
      //Si no hay ningun registro seleccionado se crea un array vacio
      if (!this.selection) {
        this.selection = [];
      } else {
        //Si hay algun registro seleccionado se convierte en un array con el objeto seleccionado dentro
        this.selection = [this.selection] as TItem[];
      }
    } else if (this.selectionMode == 'single') {
      if (Array.isArray(this.selection)) {
        if (this.selection.length > 0) {
          //Si hay algun registro seleccionado se coge el ultimo
          this.selection = (this.selection as TItem[])[
            (this.selection as TItem[]).length - 1
          ];
        } else {
          //Si no hay ningun registro seleccionado se pone a null
          this.selection = null;
        }
      } else if (!this.selection) {
        this.selection = null;
      }
    }
    this.onSelectionChangeEmitter.emit(this.selection);
  }
  public get lastSingleSelection(): TItem | undefined {
    if (Array.isArray(this.selection)) {
      return this.selection[this.selection.length - 1];
    } else if (!!this.selection) {
      return this.selection;
    } else return undefined;
  }
  public toggleSelectionMode = () => {
    this.selectionModeSetter =
      this.selectionMode == 'single' ? 'multiple' : 'single';
  };
  //#endregion SELECTION MODE

  //#region ROW EVENT - CLICKS
  /**
   * Funcion para llamar al next del onRowClick desde el template
   */
  public onRowClickNext = (
    row: ImperiaTableRow<TItem>,
    rowIndex: number,
    event: MouseEvent | KeyboardEvent
  ) => this.onRowClick.next({ row, rowIndex, event });
  private onRowClick: Subject<
    Omit<ImperiaTableRowClickEvent<TItem>, 'isSelected'>
  > = new Subject<Omit<ImperiaTableRowClickEvent<TItem>, 'isSelected'>>();
  private singleClick$ = this.onRowClick.pipe(debounceTime(250));
  private doubleClick$ = this.onRowClick.pipe(bufferCount(2));
  private clicks$ = race(this.singleClick$, this.doubleClick$).pipe(
    first(),
    repeat()
  );
  public onRowClick$ = this.onRowClick.pipe(
    tap(({ row }) => this.setSelection(row)),
    tap(() => this.onSelectionChangeEmitter.emit(this.selection)),
    buffer(this.clicks$),
    map((clicks) =>
      clicks.length > 1
        ? { ...clicks[1], type: 'double' }
        : { ...clicks[0], type: 'single' }
    ),
    tap(({ event, row, rowIndex, type }) =>
      type == 'single'
        ? this.onRowClickEmitter.emit({
            row,
            rowIndex,
            event,
            isSelected: this.isSelected(row),
          })
        : this.onRowDblClickEmitter.emit({
            row,
            rowIndex,
            event,
            isSelected: this.isSelected(row),
          })
    )
  );
  @Output('onRowClick') onRowClickEmitter: EventEmitter<
    ImperiaTableRowClickEvent<TItem>
  > = new EventEmitter<ImperiaTableRowClickEvent<TItem>>();
  @Output('onRowDblClick') onRowDblClickEmitter: EventEmitter<
    ImperiaTableRowClickEvent<TItem>
  > = new EventEmitter<ImperiaTableRowClickEvent<TItem>>();
  //#endregion ROW EVENT - CLICK

  //#region ROW EVENT - ARROW KEYS
  private get canSelectWithKeyboard(): boolean {
    return !(
      !this.isFocused ||
      this.cellEditingState.value ||
      this.selectionMode == 'multiple' ||
      Array.isArray(this.selection) ||
      this.selection == null
    );
  }
  @HostListener('document:keydown.ArrowUp', ['$event'])
  public onArrowUpFn = (event: KeyboardEvent) => {
    event.preventDefault();
    this.onArrowUp.next(event);
  };
  private onArrowUp: Subject<KeyboardEvent> = new Subject<KeyboardEvent>();
  public onArrowUp$ = this.onArrowUp.pipe(
    filter(() => this.canSelectWithKeyboard),
    withLatestFrom(this.footerVM$),
    tap(([event, footer]) => {
      const selectedRowIndex = this.value.findIndex(
        (valueItem) =>
          this.dataKeyValue(valueItem) ==
          this.dataKeyValue(this.selection as TItem)
      );
      const prevRowIndex = selectedRowIndex - 1;
      if (prevRowIndex > -1) {
        const row = this.rows[prevRowIndex];
        this.setSelection(row);
        this.onRowClickEmitter.emit({
          row,
          rowIndex: prevRowIndex,
          event,
          isSelected: this.isSelected(row),
        });
        this.viewPort.scrollToIndex(prevRowIndex, 'smooth');
      } else if (footer.visible) {
        this.setSelection(footer.row);
        this.onRowClickEmitter.emit({
          row: footer.row,
          rowIndex: FOOTER_ROW_INDEX,
          event,
          isSelected: this.isSelected(footer.row),
        });
      }
    }),
    tap(() => this.onSelectionChangeEmitter.emit(this.selection))
  );
  @HostListener('document:keydown.ArrowDown', ['$event'])
  public onArrowDownFn = (event: KeyboardEvent) => {
    event.preventDefault();
    this.onArrowDown.next(event);
  };
  private onArrowDown: Subject<KeyboardEvent> = new Subject<KeyboardEvent>();
  public onArrowDown$ = this.onArrowDown.pipe(
    filter(() => this.canSelectWithKeyboard),
    withLatestFrom(this.footerVM$),
    tap(([event, footer]) => {
      const selectedRowIndex = this.value.findIndex(
        (valueItem) =>
          this.dataKeyValue(valueItem) ==
          this.dataKeyValue(this.selection as TItem)
      );
      const nextRowIndex = selectedRowIndex + 1;
      //Si hay siguiente fila del body de la tabla
      if (nextRowIndex < this.value.length) {
        const row = this.rows[nextRowIndex];
        this.setSelection(row);
        this.onRowClickEmitter.emit({
          row,
          rowIndex: nextRowIndex,
          event,
          isSelected: this.isSelected(row),
        });
        this.viewPort.scrollToIndex(nextRowIndex, 'smooth');
        //Si no hay siguiente fila del body de la tabla, pero hay footer se selecciona el footer
      } else if (footer.visible) {
        this.setSelection(footer.row);
        this.onRowClickEmitter.emit({
          row: footer.row,
          rowIndex: FOOTER_ROW_INDEX,
          event,
          isSelected: this.isSelected(footer.row),
        });
      }
    }),
    tap(() => this.onSelectionChangeEmitter.emit(this.selection))
  );
  //#endregion ROW EVENT - ARROW KEYS

  //#region LOADING ROWS
  @Input() loading: boolean = false;
  @Output('loadingChange')
  loadingEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  public get showLoading(): boolean {
    return (
      (this.updatingValueByScrolling && !this.disableScrollEvents) ||
      this.loading
    );
  }
  private getLoadingRows = (
    columns: ImperiaTableColumn<TItem>[]
  ): ImperiaTableRow<TItem>[] => {
    return new Array(this.pageSize).fill(
      new ImperiaTableRow<any>(
        0,
        this.dataKey,
        {
          [!Array.isArray(this.dataKey) ? this.dataKey : 'Id']: null,
        },
        columns,
        false
      )
    );
  };
  public loadingRows: ImperiaTableRow<TItem>[] = this.getLoadingRows([]);
  //#endregion LOADING ROWS

  //#region VIRTUAL SCROLL
  public readonly VIRTUAL_SCROLL_ITEM_SIZE: number = 34;
  @ViewChild(CdkVirtualScrollViewport, { static: true })
  viewPort!: CdkVirtualScrollViewport;
  private viewPortAttached$: Subject<CdkVirtualScrollViewport> =
    new Subject<CdkVirtualScrollViewport>();
  /**
   * Por defecto la altura de la tabla es el 100% de la pantalla menos
   * el alto del header, el menu y el caption de la propia tabla juntos
   */
  @Input() scrollHeight: string = DEFAULT_SCROLL_HEIGHT;
  @Input() disableVerticalScroll: boolean = false;
  @Input() disableHorizontalScroll: boolean = false;
  private lastScrollValue: ImperiaTableScrollValue = {
    Page: 1,
    Size: this.pageSize,
  };
  private checkScrollsSubscription: Subscription | undefined;
  private checkScrolls$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  @Output('onScroll')
  public onScrollEmitter: EventEmitter<void> = new EventEmitter<void>();
  @Output('onScrollComplete')
  public onScrollCompleteEmitter: EventEmitter<
    ImperiaTableFilterSortScrollEvent<TItem>
  > = new EventEmitter<ImperiaTableFilterSortScrollEvent<TItem>>();
  @Output('onScrollCompleteHorizontal')
  public onScrollCompleteHorizontalEmitter: EventEmitter<
    ImperiaTableHorizontalScrollValue<TItem>
  > = new EventEmitter<ImperiaTableHorizontalScrollValue<TItem>>();
  private isScrollAtBottom = (target: HTMLElement): boolean => {
    if (this.value.length == 0 || target.scrollHeight == 0) return false;
    return (
      target.offsetHeight + target.scrollTop >= target.scrollHeight * 0.9 &&
      !this.updatingValueByScrolling
    );
  };
  private isScrollAtRight = (target: HTMLElement): boolean => {
    if (this.columns.length == 0 || target.scrollWidth == 0) return false;
    return (
      target.offsetWidth + target.scrollLeft >= target.scrollWidth * 0.9 &&
      this.columns.length < this.totalColumns &&
      !this.updatingColumnsByScrolling
    );
  };
  //#endregion VIRTUAL SCROLL

  //#region COLUMNS GROUPS TEMPLATES
  @ContentChildren(ImpColumnsGroupTemplateDirective<TItem>)
  set columnsGroupsTemplatesSetter(
    columnsGroupsTemplates: QueryList<ImpColumnsGroupTemplateDirective<TItem>>
  ) {
    this.columnsGroupsTemplates.next(columnsGroupsTemplates);
  }
  private columnsGroupsTemplates: BehaviorSubject<
    QueryList<ImpColumnsGroupTemplateDirective<TItem>>
  > = new BehaviorSubject<QueryList<ImpColumnsGroupTemplateDirective<TItem>>>(
    new QueryList<ImpColumnsGroupTemplateDirective<TItem>>()
  );

  public columnsGroups$ = combineLatest([
    this.columnsGroups,
    this.columnsGroupsTemplates,
  ]).pipe(
    tap(([columnsGroups, columnsGroupsTemplates]) =>
      this.setColumnsGroupsTemplates(columnsGroups, columnsGroupsTemplates)
    ),
    map(([columnsGroups]) => columnsGroups)
  );
  //#endregion COLUMNS GROUPS TEMPLATES

  //#region COLUMNS CELL TEMPLATES
  @ContentChildren(ImpColumnCellTemplateDirective<TItem>)
  set columnCellTemplatesSetter(
    columnCellTemplates: QueryList<ImpColumnCellTemplateDirective<TItem>>
  ) {
    this.columnCellTemplates$.next(columnCellTemplates);
    this.setColumnCellTemplates(this.columns, columnCellTemplates);
  }
  private columnCellTemplates$: BehaviorSubject<
    QueryList<ImpColumnCellTemplateDirective<TItem>>
  > = new BehaviorSubject<QueryList<ImpColumnCellTemplateDirective<TItem>>>(
    new QueryList<ImpColumnCellTemplateDirective<TItem>>()
  );
  //#endregion COLUMNS CELL TEMPLATES

  //#region FILTERS
  @Input() storageKey: string | undefined = undefined;
  @Input() hideFilterIcon: boolean = false;
  @Input() filterOnInit: boolean = false;
  @Input() disableFilters: boolean = false;
  @Input() filters: ImperiaTableFilterValue<
    TItem,
    string | TImperiaTableColumnField<TItem>
  >[] = [];
  @Input() additionalFilters: ImperiaTableColumn<any>[] = [];
  public tableFilterOpened: boolean = false;
  public tableFiltersClosedByUser: boolean = false;
  public columnsAndAdditionalFilters: ImperiaTableColumn<any>[] = [];
  private lastFilterValues: ImperiaTableFilterValue<
    TItem,
    string | TImperiaTableColumnField<TItem>
  >[] = [];
  @Output('onFilter')
  public onFilterEmitter: EventEmitter<
    ImperiaTableFilterSortScrollEvent<TItem>
  > = new EventEmitter<ImperiaTableFilterSortScrollEvent<TItem>>();
  public get canFilterByValue(): boolean {
    if (!this.selection) return false;
    if (Array.isArray(this.selection) && this.selection.length == 0) {
      return false;
    }
    return true;
  }
  public startFiltering = (
    col: ImperiaTableColumn<TItem>,
    byValue: boolean,
    op: OverlayPanel
  ) => {
    if (!col.allowFilter) return;
    if (byValue && !this.canFilterByValue) return;
    op.hide();
    if (byValue) {
      const lastSingleSelection = this.lastSingleSelection;
      if (lastSingleSelection) {
        const value =
          col.dataInfo.type == 'date'
            ? UTC(new Date(lastSingleSelection[col.field] as any))
            : lastSingleSelection[col.field];
        col.setFilterValues(value, FilterOperator.EQUAL);
      }
    }
    //Se abre el panel de filtros por si acaso no esta abierto
    this.tableFilterOpened = true;
    const selectedFilters = getFiltersFromStorage(this.storageKey);
    if (selectedFilters.find((f) => f.Column == col.filterName)) return;
    this.filters = [
      ...(selectedFilters.length ? selectedFilters : this.lastFilterValues),
      col.toFilterString(),
    ];
  };
  //#endregion FILTERS

  //#region INPUTS
  @Input() disableHeaders: boolean = false;
  @Input() width: string = '100%';
  @Input() disableScrollEvents: boolean = false;
  @Input() horizontalScrollPosition: 'start' | 'none' | 'end' = 'start';
  @Input() disableBookmark: boolean = true;
  @Input() enableSelection: boolean = false;
  @Input() enableToggleSelectionMode: boolean = false;
  @Input() enableRowReorder: boolean = false;
  @Input() enableColumnReorder: boolean = false;
  @Input() enableColumnResize: boolean = false;
  @Input() columnResizeMode: 'fit' | 'expand' = 'fit';
  @Input() useDefaultModalToAddRow: boolean = true;
  @Input() confirmOnDelete: boolean = true;
  //#endregion INPUTS

  //#region OUTPUTS
  @Output('onColResize')
  public onColResizeEmitter: EventEmitter<
    ImperiaTableColumnResizeEvent<TItem>
  > = new EventEmitter<ImperiaTableColumnResizeEvent<TItem>>();
  @Output('onRowReorder') onRowReorderEmitter: EventEmitter<
    ImperiaTableRowReorderEvent<TItem>
  > = new EventEmitter<ImperiaTableRowReorderEvent<TItem>>();
  @Output('onExport')
  public onExportEmitter: EventEmitter<
    ImperiaTableFilterSortScrollEvent<TItem>
  > = new EventEmitter<ImperiaTableFilterSortScrollEvent<TItem>>();
  @Output('onRowRender') onRowRenderEmitter: EventEmitter<
    ImperiaTableRow<TItem>
  > = new EventEmitter<ImperiaTableRow<TItem>>();
  @Output('onCellClick') onCellClickEmitter: EventEmitter<
    ImperiaTableCellClickEvent<TItem>
  > = new EventEmitter<ImperiaTableCellClickEvent<TItem>>();
  //#endregion OUTPUTS

  //#region COLUMNS SORT
  private lastSortValue: ImperiaTableSortValue<TItem> =
    new ImperiaTableSortValue<TItem>();
  //#endregion COLUMNS SORT

  //#region VIEWMODELS
  public tableVM$: Observable<ImperiaTableVM<TItem>> = combineLatest([
    this.cellEditingState,
    this.dataSource.dataStream,
    this.columns$,
    this.viewPortAttached$,
  ]).pipe(
    map(([cellEditingState, value, { columns, fields }]) => ({
      cellEditingState,
      value,
      columns,
      fields,
    }))
  );
  public addRowDialogVM$: Observable<ImperiaTableAddRowDialogVM<TItem>> =
    combineLatest([this.columns$]).pipe(
      map(([{ columns, fields }]) => ({
        columns,
        fields,
      }))
    );
  //#endregion VIEWMODELS

  constructor(
    public typedTranslateService: ImpTranslateService,
    private overlayService: ImpOverlayService,
    private clipboard: Clipboard,
    private renderer: Renderer2
  ) {}

  public dataKeyValue(
    item: TItem
  ): number | TItem[TImperiaTableColumnField<TItem>] {
    return Array.isArray(this.dataKey)
      ? createHash(this.dataKey.map((key) => item[key]).join(':'))
      : item[this.dataKey];
  }

  ngOnInit(): void {
    this.checkInconpatibilities();
  }

  ngAfterViewInit(): void {
    this.dataSource.attach(this.viewPort);
    this.viewPortAttached$.next(this.viewPort);
    this.setScrollEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['additionalFilters'] || changes['columns']) {
      this.columnsAndAdditionalFilters = [
        ...this.columns,
        ...this.additionalFilters,
      ];
    }
    if (changes['value']) {
      this.onChangesValue(changes['value'].currentValue);
    }
    if (changes['columns']) {
      this.onChangesColumns(
        changes['columns'].previousValue ?? [],
        changes['columns'].currentValue
      );
    }
    /* COMPROBAR SI ALGUNA VARIABLE QUE AFECTA AL CAPTION CAMBIA */
    if (
      changes['title'] ||
      changes['registerName'] ||
      changes['disableFilters'] ||
      changes['enableSelection'] ||
      changes['enableToggleSelectionMode'] ||
      changes['enableAddRow'] ||
      changes['enableCellEditing'] ||
      changes['enableDelete'] ||
      changes['disableBookmark']
    ) {
      this.captionVisibilityEmitter.emit(this.captionVisibility);
    }
  }

  ngOnDestroy(): void {
    this.checkScrollsSubscription?.unsubscribe();
  }

  @HostListener('window:resize')
  onResizeUpdateHeight() {
    this.scrollHeight = this.scrollHeight;
  }

  public onCloseFilters() {
    this.tableFilterOpened = !this.tableFilterOpened;
    this.tableFiltersClosedByUser = true;
  }

  public onColResize(event: ResizeColumnEvent<TItem>) {
    const frozenColumnsTotalWidth = this.columns
      .filter((col) => col.frozen)
      .reduce(
        (acc, col) => (typeof col.width === 'number' ? acc + col.width : acc),
        0
      );
    const totalWidth = event.table.offsetWidth;
    this.onColResizeEmitter.emit({
      columnResized: event.columnResized,
      columnResizedIndex: event.columnIndex,
      frozenColumnsTotalWidth,
      scrollableColumnsTotalWidth: totalWidth - frozenColumnsTotalWidth,
      totalWidth,
    });
  }

  public onCellClick(
    event: MouseEvent,
    col: ImperiaTableColumn<TItem>,
    colIndex: number,
    row: ImperiaTableRow<TItem>,
    rowIndex: number,
    cellContentContainer: HTMLDivElement,
    footerVM: {
      visible: boolean;
      row: ImperiaTableRow<TItem>;
    }
  ) {
    // setTimeout para que se ejecute despuÃ©s de que se ejecute la directiva de ediciÃ³n
    setTimeout(() => {
      if (row.cells[col.field].dataInfo.editing) return;
      this.onCellClickEmitter.emit({
        event,
        col,
        row,
        colIndex,
        rowIndex,
        footerRow: footerVM.visible ? footerVM.row : null,
        fromFooter: rowIndex == FOOTER_ROW_INDEX,
        isSelected: this.isSelected(row),
        cellElement: cellContentContainer,
        updateCell: (data: Partial<TItem>) => {
          Object.assign(row.data, data);
          //Se actualiza el valor de la celda
          row.cells[col.field].value = data[col.field] ?? null;
          //Se actualiza el valor del control
          row.cells[col.field].control.setValue(row.cells[col.field].value, {
            emitEvent: false,
          });
          //Se actualiza el contexto del template
          row.cells[col.field].templateContext = {
            $implicit: {
              col: col,
              row: row,
              colIndex: colIndex,
              rowIndex: rowIndex,
            },
          };
          //Se emite el evento de renderizado de la fila
          this.onRowRenderEmitter.emit(row);
        },
      });
    });
  }

  public getWidth(col: ImperiaTableColumn<TItem>): string {
    const width = col.width != 'auto' ? col.width + col.widthUnit : col.width;
    if (col.dataInfo.editing && col.dataInfo.editingColWidth) {
      return col.dataInfo.editingColWidth + col.widthUnit;
    }
    return width;
  }

  public onSort(
    col: ImperiaTableColumn<TItem>,
    direction: Sort,
    op: OverlayPanel
  ) {
    //Si no se puede ordenar o se intenta borrar el orden cuando no esta ordenada, no se hace nada
    if (!col.sortable || this.disableSorting) return;
    if (
      col.sortDirection$.value == this.sortTypes.NONE &&
      direction == this.sortTypes.NONE
    )
      return;
    op.hide();
    //Reiniciar todos los ordenes de las columnas
    this.columns.forEach((c) => c.sortDirection$.next(this.sortTypes.NONE));
    this.lastSortValue = {
      Column: direction == Sort.NONE ? ('' as keyof TItem) : col.filterName,
      Sort: direction,
    };
    setSortToStorage(this.storageKey, this.lastSortValue);
    this.lastScrollValue = { Page: 1, Size: this.lastScrollValue.Size };
    col.sortDirection$.next(direction);
    this.onSortEmitter.emit({
      Order: this.lastSortValue,
      Filters: this.lastFilterValues,
      Pagination: this.lastScrollValue,
      Search: this.lastSearchValue,
    });
  }

  public onFilter(
    event: ImperiaTableFilterValue<
      TItem,
      string | TImperiaTableColumnField<TItem>
    >[]
  ) {
    if (this.filterOnInit) {
      this.lastFilterValues = event;
      this.lastScrollValue = { Page: 1, Size: this.lastScrollValue.Size };
      this.onFilterEmitter.emit({
        Order: this.lastSortValue,
        Filters: this.lastFilterValues,
        Pagination: this.lastScrollValue,
        Search: this.lastSearchValue,
      });
    } else {
      this.filterOnInit = true;
    }
  }

  public onRowReorder(
    event: CdkDragDrop<
      ImperiaTableRow<TItem>[],
      ImperiaTableRow<TItem>[],
      ImperiaTableRow<TItem>
    >
  ) {
    const prevIndex = this.rows.findIndex(
      (d) =>
        this.dataKeyValue(d.data) === this.dataKeyValue(event.item.data.data)
    );
    const currentIndex =
      prevIndex +
      Math.round(
        (event.distance.y + (event.distance.y < 0 ? -5 : 5)) /
          event.item.element.nativeElement.offsetHeight
      );
    const containerDataLength = event.container.data.length;
    const finalCurrentIndex =
      currentIndex >= containerDataLength
        ? containerDataLength - 1
        : currentIndex <= 0
        ? 0
        : currentIndex;
    moveItemInArray(this.rows, prevIndex, finalCurrentIndex);
    this.dataSource.updateRows(this.rows);
    this.onRowReorderEmitter.emit({
      oldIndex: prevIndex,
      newIndex: finalCurrentIndex,
      item: this.rows[finalCurrentIndex].data,
      setDataSyncState: this.setDataSyncState,
    });
  }

  public exportExcel() {
    this.onExportEmitter.emit({
      Order: this.lastSortValue,
      Filters: this.lastFilterValues,
      Pagination: this.lastScrollValue,
      Search: this.lastSearchValue,
    });
  }

  private mapValueToImperiaTableRow(columns: ImperiaTableColumn<TItem>[]) {
    this.rows = this.value.map((item, rowIndex) => {
      const row = new ImperiaTableRow(
        rowIndex,
        this.dataKey,
        item,
        columns,
        false
      );
      this.onRowRenderEmitter.emit(row);
      return row;
    });
    this.dataSource.updateRows(this.rows);
    setTimeout(() => {
      this.viewPort.scrollTo({
        left: this.horizontalScrollPosition == 'start' ? 0 : 1000000,
      });
    });

    this.loadingEmitter.emit(false);
    this.removeRowsFromSelectionIfNotInValue(); //Se borran las filas seleccionadas que ya no estan en el array de filas
  }

  private onChangesColumns(
    oldColumns: ImperiaTableColumn<TItem>[],
    newColumns: ImperiaTableColumn<TItem>[]
  ) {
    if (this.totalColumns == 0) this.totalColumns = newColumns.length;
    oldColumns.forEach((col) => {
      this.form.removeControl(col.field, { emitEvent: false });
    });
    this.formDefaultValues = {};
    const lastSortValue = newColumns.some(({ filterName, sortable }) => {
      return (
        filterName === getSortFromStorage(this.storageKey).Column && sortable
      );
    })
      ? getSortFromStorage(this.storageKey)
      : new ImperiaTableSortValue<TItem>();

    newColumns = newColumns.map((col) => {
      const oldCol = oldColumns.find((oldCol) => oldCol.field == col.field);
      if (col.filterName == lastSortValue.Column) {
        if (!col.sortable || this.disableSorting) {
          this.lastSortValue = new ImperiaTableSortValue();
          setSortToStorage(this.storageKey, this.lastSortValue);
        } else {
          this.columns.forEach((c) =>
            c.sortDirection$.next(this.sortTypes.NONE)
          );
          col.sortDirection$.next(lastSortValue.Sort);
        }
      }
      if (col.sortDirection$.value) {
        this.lastSortValue = {
          Column: col.filterName,
          Sort: col.sortDirection$.value === 'ASC' ? Sort.ASC : Sort.DESC,
        };
      }
      if (!oldCol) return col;
      if (oldCol.allowFilter) {
        col.filtered = oldCol.filtered;
        col.filterForm = oldCol.filterForm;
        col.setFilterValues(
          oldCol.toFilter().Value,
          oldCol.toFilter().Operator
        );
      }
      if (oldCol.sortable) {
        col.sortDirection$ = oldCol.sortDirection$;
      }
      if (oldCol.resizable) {
        col.hasBeenResized = oldCol.hasBeenResized;
        oldCol.hasBeenResized && (col.width = oldCol.width);
      }

      return col;
    });
    this.setColumnCellTemplates(newColumns, this.columnCellTemplates$.value);
    this.loadingRows = this.getLoadingRows(newColumns);

    const newStringColumns = [
      ...newColumns
        .filter((col) => col.visible && col.frozenPosition != 'right')
        .map((col) => col.field),
      '**',
      ...newColumns
        .filter((col) => col.visible && col.frozenPosition == 'right')
        .map((col) => col.field),
    ];
    if (this.enableRowReorder) newStringColumns.unshift('rowReorder');
    this.columns$.next({
      columns: newColumns,
      fields: newStringColumns,
    });
    this.mapValueToImperiaTableRow(newColumns);
    newColumns.forEach((col) => {
      this.formDefaultValues[col.field] = col.dataInfo.defaultValue;
      this.form.addControl(
        col.field,
        new FormControl(
          col.dataInfo.defaultValue,
          col.dataInfo.formValidations?.validators,
          col.dataInfo.formValidations?.asyncValidators
        ),
        { emitEvent: false }
      );
    });
    this.updatingColumnsByScrolling = false;
    this.checkScrolls$.next(null);
  }

  private onChangesValue(value: TItem[]) {
    if (!Array.isArray(value)) {
      console.error('El valor de la tabla debe ser un array y no ' + value);
      return;
    }
    this.value = value;
    if (!this.updatingValueByScrolling) {
      this.viewPort.scrollTo({ top: 0, left: 0 });
    }

    if (this.columns.length == 0) {
      this.setColumnsBasedOnValueItemsProperties();
    } else {
      this.mapValueToImperiaTableRow(this.columns);
    }

    this.updatingValueByScrolling = false;
    this.checkScrolls$.next(null);
  }

  private checkScrollsComplete() {
    const scrollerChecker = interval().pipe(
      map<number, HTMLElement>(
        () => this.viewPort.elementRef.nativeElement ?? EMPTY
      )
    );
    this.checkScrollsSubscription = this.checkScrolls$
      .pipe(
        switchMap(() => scrollerChecker.pipe(take(2))),
        switchMap((scrollElement) =>
          scrollElement
            ? of(scrollElement).pipe(
                tap((scrollElement) => {
                  this.onScrollComplete({
                    target: scrollElement,
                  });
                })
              )
            : of(scrollElement)
        )
      )
      .subscribe();
  }

  private setScrollEvents() {
    this.viewPort.elementRef.nativeElement.addEventListener(
      'scroll',
      (event: Event) => {
        this.onScrollEmitter.emit();
        if (this.disableScrollEvents) return;
        this.onScrollComplete(event);
      }
    );

    this.checkScrollsComplete();
  }

  private onScrollComplete(event: { target: EventTarget | null }) {
    if (this.checkScrollsSubscription)
      this.checkScrollsSubscription.unsubscribe();
    if (this.isScrollAtBottom(event.target as HTMLElement)) {
      const Page = this.rows.length / this.lastScrollValue.Size + 1;
      if (Number.isInteger(Page)) {
        this.updatingValueByScrolling = true;

        this.lastScrollValue = {
          Page: Math.ceil(this.rows.length / this.lastScrollValue.Size) + 1,
          Size: this.lastScrollValue.Size,
        };
        this.onScrollCompleteEmitter.emit({
          Order: this.lastSortValue,
          Filters: this.lastFilterValues,
          Pagination: this.lastScrollValue,
          Search: this.lastSearchValue,
        });
      }
    }

    if (this.isScrollAtRight(event.target as HTMLElement)) {
      this.updatingColumnsByScrolling = true;
      this.onScrollCompleteHorizontalEmitter.emit({
        firstColumn: this.columns[0],
        firstColumnIndex: 0,
        lastColumn: this.columns[this.columns.length - 1],
        lastColumnIndex:
          this.columns.length - 1 == -1 ? 0 : this.columns.length - 1,
        nextFirstColumnIndex: this.columns.length,
        nextLastColumnIndex: this.columns.length + this.horizontalPageSize,
      });
    }
  }

  private setColumnsBasedOnValueItemsProperties() {
    //Se obtienen las propiedades de los items de la tabla
    const properties =
      this.value.length > 0
        ? (Object.keys(this.value[0]) as TImperiaTableColumnField<TItem>[])
        : [];
    const widthPercentage = 100 / properties.length;
    const newColumns = properties.map(
      (property) =>
        new ImperiaTableColumn(
          property,
          { type: 'string' },
          property,
          widthPercentage > 10 ? widthPercentage : 100,
          { widthUnit: widthPercentage > 10 ? '%' : 'px' }
        )
    );
    this.onChangesColumns(this.columns, newColumns);
  }

  private setColumnCellTemplates(
    columns: ImperiaTableColumn<TItem>[],
    columnCellTemplates: QueryList<ImpColumnCellTemplateDirective<TItem>>
  ) {
    if (!columnCellTemplates) return;
    columnCellTemplates.forEach((cellTemplate) => {
      const column = columns.find((col) => col.field === cellTemplate.field);
      if (column) {
        column.cellTemplate = cellTemplate.template;
      }
    });
  }

  private setColumnsGroupsTemplates(
    columnsGroups: ImperiaTableColumnsGroup<TItem>[],
    columnsGroupsTemplates: QueryList<ImpColumnsGroupTemplateDirective<TItem>>
  ) {
    if (!columnsGroupsTemplates) return;
    columnsGroupsTemplates.forEach((cellTemplate) => {
      const group = columnsGroups.find(
        (group) => group.key === cellTemplate.key
      );
      if (group) {
        group.template = cellTemplate.template;
      }
    });
  }

  public onCheckBoxInputChange(
    event: any,
    control: FormControl,
    dataInfo: Partial<ImperiaTableColumnDataInfo> &
      IImperiaTableColumnDataBoolean
  ) {
    event.target.checked
      ? control.setValue(dataInfo.trueValue)
      : control.setValue(dataInfo.falseValue);
  }

  public onDateInputChange(event: Date, control: FormControl) {
    control.setValue(moment(event).utc(true).toDate());
  }

  private checkInconpatibilities() {
    if (this.enableColumnReorder && this.columns.some((c) => c.frozen)) {
      console.error(
        'ImperiaTableComponent: Column reorder is not compatible with frozen columns'
      );
    }
  }
}
