import { NumberInput, coerceNumberProperty } from '@angular/cdk/coercion';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
  computed,
  contentChild,
  contentChildren,
  forwardRef,
  inject,
  input,
  runInInjectionContext,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ImpResizeEvent } from '@imperiascm/dom-utils';
import { withValueFrom } from '@imperiascm/rxjs-utils';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ImperiaTableV2CellSelectionComponent } from '../../../imperia-table/components/imperia-table-v2-selection/imperia-table-v2-cell-selection/imperia-table-v2-cell-selection.component';
import type {
  ImperiaTableV2CellInternalSelection as _ImperiaTableV2CellInternalSelection,
} from '../../../imperia-table/models/imperia-table-v2-cell-selection.models';
import {
  CONTEXT_MENU_ENTER_LEAVE,
  FADE_IN_OUT,
  HORIZONTAL_ELEMENT_ENTER_LEAVE,
  HORIZONTAL_LIST_ELEMENT_ENTER_LEAVE,
} from '../../../imperia-table/components/imperia-table-filter-v2/imperia-table-filter-v2.animations';
import { fieldToImperiaTableColumnClass } from '../../../imperia-table/pipes/field-to-selectable-class.pipe';
import {
  IImperiaTableColumnDataBoolean,
  TImperiaTableColumnField,
} from '../../../imperia-table/models/imperia-table-columns.types';
import { ImpColumnsGroupTemplateDirective } from '../../../imperia-table/directives/imp-columns-group-template.directive';
import { IMPERIA_TABLE_BODY_CELL_TEMPLATES_PROVIDER } from '../../imperia-table-body-cell-templates-provider';
import {
  IMPERIA_TABLE_V3_COLUMN_GROUPS_PROVIDER,
  IMPERIA_TABLE_V3_COLUMNS_PROVIDER,
} from '../../imperia-table-v3-columns-provider';
import { IMPERIA_TABLE_V3_PAGINATION_PROVIDER } from '../../../imperia-table-v3-pagination/models/imperia-table-v3-pagination-provider';
import {
  ImperiaFormDataSyncAction,
  ImperiaFormDataSyncState,
} from '../../../imperia-form/models/imperia-form.types';
import { ImperiaTableBlock } from '../../../imperia-table/models/imperia-table-block.models';
import { ImperiaTableBodyCellContextMenuButtonTemplateDirective } from '../../../imperia-table/template-directives/imperia-table-body-cell-context-menu-button-template.directive';
import {
  ImperiaTableBodyCellTemplateContext,
  ImperiaTableBodyCellTemplateDirective,
} from '../../../imperia-table/template-directives/imperia-table-body-cell-template.directive';
import { ImperiaTableCell } from '../../../imperia-table/models/imperia-table-cells.models';
import { ImperiaTableCellEditEvent } from '../../../imperia-table/models/imperia-table-editing.models';
import {
  ImperiaTableCellSaveEvent,
  ImperiaTableFilterSortScrollEvent,
} from '../../../imperia-table/models/imperia-table-outputs.models';
import {
  ImperiaTableColumn,
  ImperiaTableColumnDataInfo,
} from '../../../imperia-table/models/imperia-table-columns.models';
import { ImperiaTableColumnsGroup } from '../../../imperia-table/models/imperia-table-columns-groups.models';
import { ImperiaTableHeaderCellTemplateDirective } from '../../../imperia-table/template-directives/imperia-table-header-cell-template.directive';
import { ImperiaTableLoading } from '../../../imperia-table/models/imperia-table-loading.models';
import { ImperiaTableRow } from '../../../imperia-table/models/imperia-table-rows.models';
import { ImperiaTableV2BlockerTemplateDirective } from '../../../imperia-table/template-directives/imperia-table-v2-blocker-template.directive';
import { ImperiaTableV2CellOverlayComponent } from '../../../imperia-table/components/imperia-table-v2-cell-overlay/imperia-table-v2-cell-overlay.component';
import { ImperiaTableV2ClicksDirective } from '../../../imperia-table/directives/imperia-table-v2-clicks.directive';
import { ImperiaTableV2ColumnDirective } from '../../../imperia-table/directives/imperia-table-v2-column.directive';
import { ImperiaTableV2DeletionComponent } from '../../../imperia-table/components/imperia-table-v2-deletion/imperia-table-v2-deletion.component';
import { ImperiaTableV2PasteComponent } from '../../../imperia-table/components/imperia-table-v2-paste/imperia-table-v2-paste.component';
import { ImperiaTableV2ReorderDirective } from '../../../imperia-table/directives/imperia-table-v2-reorder.directive';
import { ImperiaTableV2RowsConfiguratorComponent } from '../../../imperia-table/components/imperia-table-v2-rows-configurator/imperia-table-v2-rows-configurator.component';
import { ImperiaTableV2RowSelectionComponent } from '../../../imperia-table/components/imperia-table-v2-selection/imperia-table-v2-row-selection/imperia-table-v2-row-selection.component';
import { ImperiaTableV2RowTemplateDirective } from '../../../imperia-table/directives/imperia-table-v2-row-template.directive';
import { ImperiaTableV2VirtualScrollStrategyDirective } from '../../../imperia-table/directives/imperia-table-v2-virtual-scroll-strategy.directive';
import { ImperiaTableV3ColumnsConfiguratorComponent } from '../../../imperia-table-v3-columns-configurator/imperia-table-v3-columns-configurator.component';
import { ImperiaTableV3ColumnsGroupDirective } from '../../directives/imperia-table-v3-columns-group-directive.directive';
import { ImperiaTableV3ColumnsGroupInMatrixProperties } from '../../models/types';
import { ImperiaTableV3ColumnsGroupsComponent } from '../imperia-table-v3-columns-groups/imperia-table-v3-columns-groups.component';
import { ImperiaTableV3LoadingComponent } from '../../../imperia-table-v3-loading/components/imperia-table-v3-loading/imperia-table-v3-loading.component';
import { ImperiaTableV3ManualPaginationComponent } from '../../../imperia-table-v3-pagination/components/imperia-table-v3-manual-pagination/imperia-table-v3-manual-pagination.component';
import { ImperiaTableV3SearchComponent } from '../../../imperia-table-v3-search/components/imperia-table-v3-search/imperia-table-v3-search.component';
import { ImperiaTableV3SortComponent } from '../../../imperia-table-v3-sort/components/imperia-table-v3-sort/imperia-table-v3-sort.component';
import { ImpMenuV2Component } from '../../../imp-menu-v2/components/imp-menu-v2/imp-menu-v2.component';
import { ImpMenuV2ItemGroupDirective } from '../../../imp-menu-v2/directives/imp-menu-v2-item-group.directive';
import { ImpUnitNameComponent } from '../../../imp-unit-name/imp-unit-name.component';
import { ResizableColumnV2Directive } from '../../../imperia-table/directives/resizable-column-v2-directive.directive';
import { UTC, createHash, keys } from '@imperiascm/scp-utils/functions';
import { FilterOperator } from '@imperiascm/scp-utils/payload';
import dayjs from 'dayjs/esm';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  ReplaySubject,
  Subject,
  animationFrameScheduler,
  combineLatest,
  combineLatestWith,
  debounceTime,
  defer,
  delay,
  distinctUntilChanged,
  filter,
  first,
  firstValueFrom,
  map,
  merge,
  mergeWith,
  of,
  pairwise,
  share,
  shareReplay,
  skip,
  startWith,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ImperiaTableV3FiltersComponent } from '../../../imperia-table-v3-filters/components/imperia-table-v3-filters/imperia-table-v3-filters.component';
import {
  IMPERIA_TABLE_V2_HOST,
  IMPERIA_TABLE_V3_HOST,
  type ImperiaTableV2Host,
  type ImperiaTableV3Host,
} from '../../../shared/template-apis/imperia-table.tokens';

@Component({
  selector: 'imperia-table-v3',
  templateUrl: './imperia-table-v3.component.html',
  styleUrls: [
    './imperia-table-v3.block.scss',
    './imperia-table-v3.caption.scss',
    './imperia-table-v3.editing.scss',
    './imperia-table-v3.component.scss',
  ],
  animations: [
    HORIZONTAL_LIST_ELEMENT_ENTER_LEAVE,
    HORIZONTAL_ELEMENT_ENTER_LEAVE,
    CONTEXT_MENU_ENTER_LEAVE,
    FADE_IN_OUT,
  ],
  providers: [
    {
      provide: IMPERIA_TABLE_V2_HOST,
      useExisting: forwardRef(() => ImperiaTableV3Component),
    },
    {
      provide: IMPERIA_TABLE_V3_HOST,
      useExisting: forwardRef(() => ImperiaTableV3Component),
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV3Component<TItem extends object>
  implements ImperiaTableV3Host<TItem>
{
  //#region INJECTOR
  public injector = inject(Injector);
  //#endregion INJECTOR
  //#region CONTAINER
  @ViewChild('container') set containerSetter(v: ElementRef<HTMLDivElement>) {
    this.container.next(v.nativeElement);
  }
  private container: ReplaySubject<HTMLDivElement> =
    new ReplaySubject<HTMLDivElement>(1);
  public container$: Observable<HTMLDivElement> = this.container.pipe(
    first(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion CONTAINER

  //#region CAPTION MENU
  private captionMenu = new ReplaySubject<ImpMenuV2Component | undefined>(1);
  @ViewChild('captionMenu')
  set menuCaptionSetter(v: ImpMenuV2Component | undefined) {
    this.captionMenu.next(v);
  }
  public captionMenu$ = this.captionMenu.pipe(
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion CAPTION MENU

  //#region CAPTION MENU ITEM GROUPS
  @ContentChildren(ImpMenuV2ItemGroupDirective, { descendants: true })
  set menuGroupsSetter(v: QueryList<ImpMenuV2ItemGroupDirective>) {
    this.menuGroups.next(v);
  }
  private menuGroups: ReplaySubject<QueryList<ImpMenuV2ItemGroupDirective>> =
    new ReplaySubject<QueryList<ImpMenuV2ItemGroupDirective>>(1);
  public menuGroupsChanges$: Observable<ImpMenuV2ItemGroupDirective[]> =
    this.menuGroups.pipe(
      switchMap((menuGroups) =>
        menuGroups.changes.pipe(
          startWith(null),
          map(() => menuGroups.toArray())
        )
      )
    );
  //#endregion CAPTION MENU ITEM GROUPS

  //#region VIEW CONTAINER REFS
  @ViewChild('cellOverlayVcr', { read: ViewContainerRef })
  cellOverlayVcr!: ViewContainerRef;
  @ViewChild('lastCellClickedContextMenuVcr', { read: ViewContainerRef })
  lastCellClickedContextMenuVcr!: ViewContainerRef;
  //#endregion VIEW CONTAINER REFS

  //#region CELL OVERLAY
  @ContentChild(ImperiaTableV2CellOverlayComponent)
  set cellOverlayComponentSetter(
    v: ImperiaTableV2CellOverlayComponent<TItem> | undefined
  ) {
    this.cellOverlayComponent.next(v);
  }
  private cellOverlayComponent = new ReplaySubject<
    ImperiaTableV2CellOverlayComponent<TItem> | undefined
  >(1);
  public cellOverlayComponent$ = this.cellOverlayComponent.asObservable();
  //#endregion CELL OVERLAY

  //#region VIRTUAL SCROLL VIEWPORT
  @ViewChild(ImperiaTableV2VirtualScrollStrategyDirective)
  virtualScrollStrategy!: ImperiaTableV2VirtualScrollStrategyDirective<TItem>;
  @ViewChild(CdkVirtualScrollViewport) set viewportSetter(
    v: CdkVirtualScrollViewport | undefined
  ) {
    if (!v) return;
    this.viewport$.next(v);
  }
  public viewport$: ReplaySubject<CdkVirtualScrollViewport> =
    new ReplaySubject<CdkVirtualScrollViewport>(1);

  public scrollToIndex = (index: number) => this.scrolledToIndex.next(index);
  private scrolledToIndex = new Subject<number>();
  public focusedRowDataKeyValue$ = merge(
    this.scrolledToIndex.pipe(
      withLatestFrom(
        defer(() => this.rows$),
        this.viewport$
      ),
      tap(([index, rows, viewport]) => viewport.scrollToIndex(index, 'smooth')),
      map(([index, rows]) => rows[index].dataKeyValue)
    ),
    this.scrolledToIndex.pipe(
      debounceTime(2000, animationFrameScheduler),
      map(() => null)
    )
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion VIRTUAL SCROLL VIEWPORT

  //#region FOCUS HANDLING
  public onFocusChange = new ReplaySubject<string | null>(1);
  public isFocused$ = merge(
    this.onFocusChange.pipe(
      filter((focus) => focus != null),
      map(() => true)
    ),
    this.onFocusChange.pipe(
      filter((focus) => focus == null),
      map(() => false)
    )
  );
  //#endregion FOCUS HANDLING

  //#region ADD
  @Input('allowAdd') allowAdd: boolean | null = null;
  @Input('adding') set addingSetter(v: boolean | null) {
    this.adding.next(!!v);
  }
  public adding: BehaviorSubject<boolean> = new BehaviorSubject(false);
  @Input('addButtonLoading') set addButtonLoadingSetter(v: boolean | null) {
    this.addButtonLoading.next(!!v);
  }
  public addButtonLoading: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  @Output('onClickAddButton') onClickAddButtonEmitter: EventEmitter<void> =
    new EventEmitter<void>();
  public get addAllowed() {
    if (this.allowAdd == false) return false;
    if (this.onClickAddButtonEmitter.observed) return true;
    return false;
  }
  //#endregion ADD

  //#region DELETION
  @Input('allowDelete') allowDelete: boolean | null = null;
  public get deleteAllowed() {
    return this.allowDelete ?? true;
  }
  @ContentChild(ImperiaTableV2DeletionComponent<TItem>)
  set ImperiaTableV2DeletionComponentSetter(
    v: ImperiaTableV2DeletionComponent<TItem> | undefined
  ) {
    this.imperiaTableV2DeletionComponent.next(v);
  }
  public imperiaTableV2DeletionComponent = new ReplaySubject<
    ImperiaTableV2DeletionComponent<TItem> | undefined
  >(1);
  public hasDeletion$ = this.imperiaTableV2DeletionComponent.pipe(
    map((imperiaTableV2DeletionComponent) => !!imperiaTableV2DeletionComponent),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion DELETION

  //#region PAGE SIZE
  @Input('pageSize') set pageSizeSetter(v: number | null) {
    if (v == null) return;
    this.pageSize.next(v);
  }
  public pageSize = new BehaviorSubject<number>(100);
  //#endregion PAGE SIZE

  //#region STORAGE
  @Input('storageKey') set storageKeySetter(v: string | null) {
    if (!v) return;
    this.storageKey.next(v);
  }
  public storageKey = new BehaviorSubject<string>('');
  public storage$ = this.storageKey.pipe(
    withLatestFrom(this.pageSize),
    map(
      ([, Size]) =>
        new ImperiaTableFilterSortScrollEvent<TItem>({
          Pagination: { Size },
        })
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion STORAGE

  //#region NO DATA TEMPLATE
  public $noDataTemplate = contentChild<TemplateRef<any>>('noDataTemplate');
  //#endregion NO DATA TEMPLATE

  //#region COLUMNS GROUPS TEMPLATES
  @ContentChildren(ImpColumnsGroupTemplateDirective<TItem>)
  set columnsGroupsTemplatesSetter(
    v: QueryList<ImpColumnsGroupTemplateDirective<TItem>>
  ) {
    this.columnsGroupsTemplates.next(v);
  }
  private columnsGroupsTemplates = new ReplaySubject<
    QueryList<ImpColumnsGroupTemplateDirective<TItem>>
  >(1);
  private columnsGroupsTemplatesChanges$: Observable<
    ImpColumnsGroupTemplateDirective<TItem>[]
  > = this.columnsGroupsTemplates.pipe(
    first(),
    switchMap((columnsGroupsTemplates) =>
      columnsGroupsTemplates.changes.pipe(
        startWith(null),
        map(() => columnsGroupsTemplates.toArray())
      )
    )
  );
  //#endregion COLUMNS GROUPS TEMPLATES

  //#region COLUMNS GROUPS
  @Input('columnsGroups') set columnsGroupsMatrixSetter(
    v:
      | ImperiaTableColumnsGroup<TItem>[]
      | ImperiaTableColumnsGroup<TItem>[][]
      | null
  ) {
    if (!v) return;
    if (!v.length) return;
    if (this.hasMultipleColumnsGroupsRows(v)) {
      this.columnsGroupsMatrix.next(v);
    } else {
      this.columnsGroupsMatrix.next([v]);
    }
  }

  @ContentChildren(IMPERIA_TABLE_V3_COLUMN_GROUPS_PROVIDER, {
    descendants: true,
  })
  set columnsGroupsDirectivesSetter(
    v:
      | QueryList<
          | ImperiaTableV3ColumnsGroupDirective<TItem>
          | ImperiaTableV3ColumnsGroupsComponent<TItem>
        >
      | undefined
  ) {
    if (!v) return;
    this.columnsGroupsDirectives.next(v);
  }

  private columnsGroupsDirectives = new ReplaySubject<
    QueryList<
      | ImperiaTableV3ColumnsGroupDirective<TItem>
      | ImperiaTableV3ColumnsGroupsComponent<TItem>
    >
  >();

  private columnsGroupsDirectivesChanges$: Observable<
    ImperiaTableV3ColumnsGroupDirective<TItem>[]
  > = this.columnsGroupsDirectives.pipe(
    first(),
    switchMap((columnsGroupsDirectives) =>
      columnsGroupsDirectives.changes.pipe(
        startWith(null),
        switchMap(() =>
          combineLatest(
            columnsGroupsDirectives
              .toArray()
              .map((v) =>
                v instanceof ImperiaTableV3ColumnsGroupsComponent
                  ? v.columnsGroups.pipe(map((cols) => cols.toArray()))
                  : of(v)
              )
          ).pipe(map((cols) => cols.flat()))
        )
      )
    )
  );

  private _columnsGroupsMatrix$: Observable<
    ImperiaTableV3ColumnsGroupDirective<TItem>[][]
  > = this.columnsGroupsDirectivesChanges$.pipe(
    map((columnsGroups) => {
      if (columnsGroups.length === 1) return [columnsGroups];
      if (columnsGroups.length > 1) {
        const groups = [] as ImperiaTableV3ColumnsGroupDirective<TItem>[][];
        columnsGroups.forEach((colGroup) => {
          colGroup.keySetter(colGroup.key);
          if (!groups[colGroup.level]) {
            groups[colGroup.level] = [];
          }
          groups[colGroup.level].push(colGroup);
        });
        return groups;
      }
      return [];
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private columnsGroupsMatrix: BehaviorSubject<
    ImperiaTableColumnsGroup<TItem>[][]
  > = new BehaviorSubject<ImperiaTableColumnsGroup<TItem>[][]>([]);
  public columnsGroupsMatrix$ = combineLatest([
    this.columnsGroupsMatrix,
    this.columnsGroupsTemplatesChanges$,
  ]).pipe(
    map(([columnsGroupsMatrix, columnsGroupsTemplates]) =>
      columnsGroupsMatrix.map((columnsGroups) =>
        this.setColumnsGroupsTemplates(columnsGroups, columnsGroupsTemplates)
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  private setColumnsGroupsTemplates(
    columnsGroups: ImperiaTableColumnsGroup<TItem>[],
    columnsGroupsTemplates: ImpColumnsGroupTemplateDirective<TItem>[]
  ) {
    return columnsGroups.map((colGroup) => {
      const { template } =
        columnsGroupsTemplates.find(({ key }) => colGroup.key === key) ?? {};
      colGroup.template = template;
      return colGroup;
    });
  }
  private hasMultipleColumnsGroupsRows(
    columnsGroups:
      | ImperiaTableColumnsGroup<TItem>[]
      | ImperiaTableColumnsGroup<TItem>[][]
  ): columnsGroups is ImperiaTableColumnsGroup<TItem>[][] {
    return Array.isArray(columnsGroups[0]);
  }
  //#endregion COLUMNS GROUPS

  //#region COLUMNS HEADER CELLS TEMPLATES
  @ContentChildren(ImperiaTableHeaderCellTemplateDirective<TItem>)
  set columnHeaderCellTemplatesSetter(
    v: QueryList<ImperiaTableHeaderCellTemplateDirective<TItem>>
  ) {
    this.columnHeaderCellTemplates.next(v);
  }
  private columnHeaderCellTemplates = new ReplaySubject<
    QueryList<ImperiaTableHeaderCellTemplateDirective<TItem>>
  >(1);
  private columnHeaderCellTemplatesChanges$: Observable<
    ImperiaTableHeaderCellTemplateDirective<TItem>[]
  > = this.columnHeaderCellTemplates.pipe(
    first(),
    switchMap((columnHeaderCellTemplates) =>
      columnHeaderCellTemplates.changes.pipe(
        startWith(null),
        map(() => columnHeaderCellTemplates.toArray())
      )
    )
  );
  //#endregion COLUMNS HEADER CELLS TEMPLATES

  //#region COLUMNS BODY CELLS TEMPLATES FROM TEMPLATE DIRECTIVE
  @ContentChildren(IMPERIA_TABLE_BODY_CELL_TEMPLATES_PROVIDER)
  set columnBodyCellTemplatesSetter(
    v: QueryList<
      ImperiaTableBodyCellTemplateDirective<TItem> | ImpUnitNameComponent<TItem>
    >
  ) {
    this.columnBodyCellTemplates.next(v);
  }
  private columnBodyCellTemplates = new ReplaySubject<
    QueryList<
      ImperiaTableBodyCellTemplateDirective<TItem> | ImpUnitNameComponent<TItem>
    >
  >(1);

  private columnBodyCellTemplatesChanges$: Observable<
    (
      | ImperiaTableBodyCellTemplateDirective<TItem>
      | ImpUnitNameComponent<TItem>
    )[]
  > = this.columnBodyCellTemplates.pipe(
    first(),
    switchMap((columnBodyCellTemplates) =>
      columnBodyCellTemplates.changes.pipe(
        startWith(null),
        map(() => columnBodyCellTemplates.toArray())
      )
    )
  );
  //#endregion COLUMNS BODY CELLS TEMPLATES FROM TEMPLATE DIRECTIVE

  //#region COLUMNS CONFIGURATOR
  public $allowToConfigureColumns = input<boolean>(true, {
    alias: 'allowToConfigureColumns',
  });
  @ContentChild(ImperiaTableV3ColumnsConfiguratorComponent<TItem>, {
    static: true,
  })
  set columnsConfiguratorSetter(
    v: ImperiaTableV3ColumnsConfiguratorComponent<TItem> | undefined
  ) {
    this.columnsConfigurator.next(v);
  }
  private columnsConfigurator = new ReplaySubject<
    ImperiaTableV3ColumnsConfiguratorComponent<TItem> | undefined
  >(1);
  public hasColumnsConfigurator$ = this.columnsConfigurator.pipe(
    map((columnsConfigurator) => !!columnsConfigurator)
  );

  public columnPositionActionsTemplate$ = this.columnsConfigurator.pipe(
    switchMap(
      (columnsConfigurator) =>
        columnsConfigurator?.columnPositionActions$ ?? of(null)
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public columnVisibilityActionsTemplate$ = this.columnsConfigurator.pipe(
    switchMap(
      (columnsConfigurator) =>
        columnsConfigurator?.columnVisibilityActions$ ?? of(null)
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion COLUMNS CONFIGURATOR

  //#region ROWS CONFIGURATOR
  @ContentChild(ImperiaTableV2RowsConfiguratorComponent<TItem>)
  set rowsConfiguratorSetter(
    v: ImperiaTableV2RowsConfiguratorComponent<TItem> | undefined
  ) {
    this.rowsConfigurator.next(v);
  }
  private rowsConfigurator = new ReplaySubject<
    ImperiaTableV2RowsConfiguratorComponent<TItem> | undefined
  >(1);
  public hasRowsConfigurator$ = this.rowsConfigurator.pipe(
    map((rowsConfigurator) => !!rowsConfigurator)
  );
  //#endregion ROWS CONFIGURATOR

  //#region COLUMNS DIRECTIVES
  private $columnsProviders = contentChildren(
    IMPERIA_TABLE_V3_COLUMNS_PROVIDER,
    { descendants: true }
  );

  private $columnsFromProviders = computed(() => {
    const columnsProviders = this.$columnsProviders();
    return columnsProviders.flatMap((provider) =>
      provider instanceof ImperiaTableV2ColumnDirective
        ? provider
        : provider.$columns()
    );
  });

  public columnsFromDirectives$ = toObservable(this.$columnsFromProviders).pipe(
    switchMap((columnsDirectives) =>
      combineLatest(columnsDirectives.map((col) => col.column$)).pipe(
        debounceTime(500)
      )
    )
  );
  //#endregion COLUMNS DIRECTIVES

  //#region COLUMNS
  @Input('columns') set columnsSetter(v: ImperiaTableColumn<TItem>[] | null) {
    if (!v) return;
    this.columns.next(v);
  }
  public columns: ReplaySubject<ImperiaTableColumn<TItem>[]> =
    new ReplaySubject(1);
  public columns$: Observable<ImperiaTableColumn<TItem>[]> = merge(
    this.columns,
    this.columnsFromDirectives$
  ).pipe(
    combineLatestWith(this.viewport$.pipe(take(1))),
    tap(([columns, viewport]) => viewport.scrollTo({ left: 0 })),
    map(([columns]) => columns),
    combineLatestWith(
      this.columnHeaderCellTemplatesChanges$,
      this.columnBodyCellTemplatesChanges$
    ),
    map(([columns, columnHeaderCellTemplates, columnBodyCellTemplates]) =>
      this.setColumnCellTemplates(
        columns,
        columnHeaderCellTemplates,
        columnBodyCellTemplates
      )
    ),
    startWith<ImperiaTableColumn<TItem>[]>([]),
    pairwise(),
    map(([prev, curr]) => {
      if (prev.length == 0) return curr;
      return curr.map((col) => {
        const prevColWithSameField = prev.find(
          ({ field }) => field == col.field
        );
        if (!prevColWithSameField) return col;
        return col.asCopyOf(prevColWithSameField);
      });
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public columnsConfigured$: Observable<ImperiaTableColumn<TItem>[]> =
    combineLatest([this.columns$, this.columnsConfigurator]).pipe(
      switchMap(([columns, columnsConfigurator]) => {
        if (!columnsConfigurator) return of(columns);
        return columnsConfigurator.columnsConfigured$;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  private setColumnCellTemplates(
    columns: ImperiaTableColumn<TItem>[],
    columnHeaderCellTemplates: ImperiaTableHeaderCellTemplateDirective<TItem>[],
    columnBodyCellTemplates: (
      | ImperiaTableBodyCellTemplateDirective<TItem>
      | ImpUnitNameComponent<TItem>
    )[]
  ) {
    return columns.map((col) => {
      const { template: headerCellTemplate } =
        columnHeaderCellTemplates.find(({ field }) => col.field === field) ??
        {};

      const bodyCellTemplate = columnBodyCellTemplates.find((c) =>
        c instanceof ImpUnitNameComponent
          ? c.$field() === col.field
          : c.field === col.field
      );

      if (bodyCellTemplate instanceof ImpUnitNameComponent) {
        bodyCellTemplate.setColumn(col);
      }

      col.headerCellTemplate ||= headerCellTemplate;
      col.bodyCellTemplate ||=
        bodyCellTemplate instanceof ImpUnitNameComponent
          ? bodyCellTemplate.$template()
          : bodyCellTemplate?.template;
      return col;
    });
  }
  //#endregion COLUMNS

  //#region HEADERS VISIBILITY
  public _headHeightChange = new Subject<ImpResizeEvent>();
  public headHeightChange$ = this._headHeightChange.pipe(
    map(({ DOMRect }) => DOMRect.height)
  );
  public hasSomeHeader$ = this.columns$.pipe(
    map((columns) =>
      columns.some(
        ({ header, headerCellTemplate }) => !!header || !!headerCellTemplate
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion HEADERS VISIBILITY

  //#region COLUMNS ADJUSTMENT TO CONTENT
  @Input('disableColumnsAdjustmentToContent')
  set disableColumnsAdjustmentToContentSetter(v: boolean | null) {
    this.disableColumnsAdjustmentToContent.next(v);
  }
  private disableColumnsAdjustmentToContent = new BehaviorSubject<
    boolean | null
  >(null);
  public adjustColumnsToContentAllowed$ =
    this.disableColumnsAdjustmentToContent.pipe(
      switchMap((disableColumnsAdjustmentToContent) =>
        disableColumnsAdjustmentToContent == null
          ? this.columnsConfigured$.pipe(
              map((columns) => columns.some(({ resizable }) => resizable))
            )
          : of(!disableColumnsAdjustmentToContent)
      )
    );
  @ViewChildren(ResizableColumnV2Directive)
  set resizableColumnDirectivesSetter(
    v: QueryList<ResizableColumnV2Directive<TItem>>
  ) {
    this.resizableColumnDirectives.next(v);
  }
  private resizableColumnDirectives = new ReplaySubject<
    QueryList<ResizableColumnV2Directive<TItem>>
  >(1);
  private resizableColumnDirectives$ = this.resizableColumnDirectives.pipe(
    switchMap((resizableColumnDirectives) =>
      resizableColumnDirectives.changes.pipe(
        map(() => resizableColumnDirectives.toArray()),
        startWith(resizableColumnDirectives.toArray())
      )
    )
  );
  public adjustColumnsToContentFn$: Observable<() => void> =
    this.resizableColumnDirectives$.pipe(
      map(
        (resizableColumnDirectives) => () =>
          resizableColumnDirectives.forEach((resizableColumnDirective) =>
            resizableColumnDirective.adjustToContent()
          )
      )
    );
  //#endregion COLUMNS ADJUSTMENT TO CONTENT

  //#region REORDER
  @ContentChild(ImperiaTableV2ReorderDirective<TItem>)
  set imperiaTableV2ReorderDirectiveSetter(
    v: ImperiaTableV2ReorderDirective<TItem> | undefined
  ) {
    this.imperiaTableV2ReorderDirective.next(v);
  }
  public imperiaTableV2ReorderDirective = new ReplaySubject<
    ImperiaTableV2ReorderDirective<TItem> | undefined
  >(1);

  public onRowReorder = new Subject<CdkDragDrop<ImperiaTableRow<TItem>[]>>();

  public reorderedRows$ = this.imperiaTableV2ReorderDirective.pipe(
    switchMap(
      (imperiaTableV2SelectionDirective) =>
        imperiaTableV2SelectionDirective?.reorderedRows$ ?? EMPTY
    )
  );

  public hasReorder$ = this.imperiaTableV2ReorderDirective.pipe(
    map((imperiaTableV2ReorderDirective) => !!imperiaTableV2ReorderDirective),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion REORDER

  //#region MIN ROW HEIGHT
  private readonly MIN_ROW_HEIGHT = 34;
  @Input('minRowHeight') set minRowHeightSetter(v: NumberInput) {
    this.minRowHeight = coerceNumberProperty(v, this.MIN_ROW_HEIGHT);
    this.el.nativeElement.style.setProperty('--row-height', v + 'px');
  }
  public minRowHeight: number = this.MIN_ROW_HEIGHT;
  //#endregion MIN ROW HEIGHT

  //#region ROW HEIGHT CALCULATION FUNCTION
  @Input() rowHeightCalcFn: (
    row: ImperiaTableRow<TItem>,
    minRowHeight: number
  ) => number = () => this.minRowHeight;
  //#endregion ROW HEIGHT CALCULATION FUNCTION

  //#region ROWS INPUT
  @Input() showNoDataMessage: boolean = true;
  @Input('value') set valueSetter(v: TItem[] | null) {
    if (!v) return;
    this.value.next(v);
  }
  public value: ReplaySubject<TItem[]> = new ReplaySubject(1);
  //#endregion ROWS INPUT

  //#region ROWSPAN
  public toggleRowspan = new Subject<void>();
  public rowspanEnabled$: Observable<boolean> = this.toggleRowspan.pipe(
    switchMap(() => this.rowspanEnabled$.pipe(take(1))),
    map((rowspanEnabled) => !rowspanEnabled),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  private getDistinctValueRanges(
    field: TImperiaTableColumnField<TItem>,
    rows: ImperiaTableRow<TItem>[],
    parent?: {
      startIndex: number;
      endIndex: number;
    }
  ): {
    value: TItem[TImperiaTableColumnField<TItem>];
    startIndex: number;
    endIndex: number;
  }[] {
    const { startIndex = 0, endIndex = rows.length - 1 } = parent ?? {};
    const slicedData = rows.slice(startIndex, endIndex + 1);
    return slicedData.reduce<
      {
        value: TItem[TImperiaTableColumnField<TItem>];
        startIndex: number;
        endIndex: number;
      }[]
    >((acc, row, rowIndex) => {
      if (!acc.length) {
        acc.push({
          value: row.data[field],
          startIndex: startIndex + rowIndex,
          endIndex: startIndex + slicedData.length - 1,
        });
      } else if (
        slicedData[rowIndex - 1] &&
        slicedData[rowIndex - 1].data[field] != row.data[field]
      ) {
        acc[acc.length - 1].endIndex = startIndex + rowIndex - 1;
        acc.push({
          value: row.data[field],
          startIndex: startIndex + rowIndex,
          endIndex: startIndex + slicedData.length - 1,
        });
      }
      return acc;
    }, []);
  }
  private getColCellsRowspans(
    columns: ImperiaTableColumn<TItem>[],
    rows: ImperiaTableRow<TItem>[]
  ) {
    return columns.reduce<
      {
        value: TItem[TImperiaTableColumnField<TItem>];
        startIndex: number;
        endIndex: number;
      }[][]
    >((acc, col) => {
      if (acc.length === 0) {
        acc.push(this.getDistinctValueRanges(col.field, rows));
        return acc;
      }
      const prevColCellsRowspans = acc[acc.length - 1];
      const b = prevColCellsRowspans.flatMap((colCellRowspan) =>
        this.getDistinctValueRanges(col.field, rows, colCellRowspan)
      );
      acc.push(b);
      return acc;
    }, []);
  }
  private setCellsRowspans(
    columns: ImperiaTableColumn<TItem>[],
    rows: ImperiaTableRow<TItem>[]
  ) {
    const frozenColumns = [
      ...columns.filter(
        ({ visible, frozen, frozenPosition }) =>
          visible && frozen && frozenPosition === 'left'
      ),
      ...columns.filter(
        ({ visible, frozen, frozenPosition }) =>
          visible && frozen && frozenPosition === 'right'
      ),
    ];
    const colCellsRowspans = this.getColCellsRowspans(frozenColumns, rows);
    return rows.map((row, index, rows) => {
      frozenColumns.forEach((col, colIndex) => {
        const cellRowspan = colCellsRowspans[colIndex];
        const cellRowspanStart = cellRowspan.find(
          ({ startIndex }) => startIndex == index
        );
        if (cellRowspanStart) {
          row.cells[col.field].rowspan = rows
            .slice(cellRowspanStart.startIndex, cellRowspanStart.endIndex + 1)
            .reduce((acc, r) => acc + r.height, 0);
          return;
        }
        const cellRowspanEnd = cellRowspan.find(
          ({ endIndex }) => endIndex == index
        );
        if (cellRowspanEnd) {
          row.isLastRowInRowspan = true;
          return;
        }
      });
      return row;
    });
  }
  //#endregion ROWSPAN

  //#region ROWS
  @Input() dataKey:
    | TImperiaTableColumnField<TItem>
    | TImperiaTableColumnField<TItem>[] =
    'Id' as TImperiaTableColumnField<TItem>;
  public rows$ = combineLatest([
    this.value,
    this.columnsConfigured$,
    this.rowspanEnabled$,
  ]).pipe(
    map(([items, columns, rowspanEnabled]) =>
      this.mapToRows(items, columns, false, rowspanEnabled)
    ),
    map((rows) => rows.filter((row) => row.visible)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public mapToRows(
    data: TItem[],
    columns: ImperiaTableColumn<TItem>[],
    fromFooter: boolean = false,
    withRowspan: boolean = false
  ) {
    const rows = data.map((item, rowIndex) => {
      const row = new ImperiaTableRow(
        rowIndex,
        this.dataKey,
        item,
        columns,
        fromFooter
      );
      this.onRowRenderEmitter.emit(row);
      row.height = this.rowHeightCalcFn(row, this.minRowHeight);
      return row;
    });
    return withRowspan ? this.setCellsRowspans(columns, rows) : rows;
  }
  @Output('onRowRender') onRowRenderEmitter: EventEmitter<
    ImperiaTableRow<TItem>
  > = new EventEmitter<ImperiaTableRow<TItem>>();
  //#endregion ROWS

  //#region FOOTER ROWS INPUT
  @Input('footerValue') set footerValueSetter(v: TItem[] | null) {
    if (!v) return;
    this.footerValue.next(v);
  }
  private footerValue: BehaviorSubject<TItem[]> = new BehaviorSubject<TItem[]>(
    []
  );
  //#endregion FOOTER ROWS INPUT

  //#region FOOTER ROWS
  public _footHeightChange = new Subject<ImpResizeEvent>();
  public footHeightChange$ = this._footHeightChange.pipe(
    map(({ DOMRect }) => DOMRect.height)
  );
  public footerRows$ = combineLatest([
    this.footerValue,
    this.columnsConfigured$,
    this.rowspanEnabled$,
  ]).pipe(
    map(([items, columns, rowspanEnabled]) =>
      this.mapToRows(items, columns, true, rowspanEnabled)
    ),
    tap((rows) => rows.map((row) => this.onFooterRowRenderEmitter.emit(row))),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  @Output('onFooterRowRender') onFooterRowRenderEmitter: EventEmitter<
    ImperiaTableRow<TItem>
  > = new EventEmitter<ImperiaTableRow<TItem>>();
  //#endregion FOOTER ROWS

  //#region BODY ROW TEMPLATES
  @ViewChild('bodyCellContentTemplate')
  bodyCellContentTemplate!: TemplateRef<ImperiaTableBodyCellTemplateContext>;

  @ContentChildren(ImperiaTableV2RowTemplateDirective<TItem>)
  set imperiaTableV2RowTemplatesSetter(
    v: QueryList<ImperiaTableV2RowTemplateDirective<TItem>>
  ) {
    this.imperiaTableV2RowTemplates.next(v);
  }
  private imperiaTableV2RowTemplates = new ReplaySubject<
    QueryList<ImperiaTableV2RowTemplateDirective<TItem>>
  >(1);
  private imperiaTableV2RowTemplatesChanges$: Observable<
    ImperiaTableV2RowTemplateDirective<TItem>[]
  > = this.imperiaTableV2RowTemplates.pipe(
    first(),
    switchMap((imperiaTableV2RowTemplates) =>
      imperiaTableV2RowTemplates.changes.pipe(
        startWith(null),
        map(() => imperiaTableV2RowTemplates.toArray())
      )
    )
  );

  public frozenLeftCellsTemplate$ =
    this.imperiaTableV2RowTemplatesChanges$.pipe(
      map((imperiaTableV2RowTemplates) =>
        imperiaTableV2RowTemplates.filter(({ useOn }) => useOn === 'frozenLeft')
      ),
      map((imperiaTableV2RowTemplates) => imperiaTableV2RowTemplates[0])
    );

  public unfrozenCellsTemplate$ = this.imperiaTableV2RowTemplatesChanges$.pipe(
    map((imperiaTableV2RowTemplates) =>
      imperiaTableV2RowTemplates.filter(({ useOn }) => useOn === 'unfrozen')
    ),
    map((imperiaTableV2RowTemplates) => imperiaTableV2RowTemplates[0])
  );

  public frozenRightCellsTemplate$ =
    this.imperiaTableV2RowTemplatesChanges$.pipe(
      map((imperiaTableV2RowTemplates) =>
        imperiaTableV2RowTemplates.filter(
          ({ useOn }) => useOn === 'frozenRight'
        )
      ),
      map((imperiaTableV2RowTemplates) => imperiaTableV2RowTemplates[0])
    );
  //#endregion BODY ROW TEMPLATES

  //#region BODY/FOOTER ROW CONTEXT MENU BUTTONS TEMPLATES
  @ContentChildren(
    ImperiaTableBodyCellContextMenuButtonTemplateDirective<TItem>
  )
  set rowContextMenuButtonTemplatesSetter(
    v: QueryList<ImperiaTableBodyCellContextMenuButtonTemplateDirective<TItem>>
  ) {
    this.rowContextMenuButtonTemplates.next(v);
  }
  private rowContextMenuButtonTemplates = new ReplaySubject<
    QueryList<ImperiaTableBodyCellContextMenuButtonTemplateDirective<TItem>>
  >(1);
  public rowContextMenuButtonTemplatesChanges$: Observable<
    ImperiaTableBodyCellContextMenuButtonTemplateDirective<TItem>[]
  > = this.rowContextMenuButtonTemplates.pipe(
    first(),
    switchMap((rowContextMenuButtonTemplates) =>
      rowContextMenuButtonTemplates.changes.pipe(
        startWith(null),
        map(() => rowContextMenuButtonTemplates.toArray())
      )
    )
  );
  public hasRowContextMenuCustomButton$ =
    this.rowContextMenuButtonTemplates.pipe(
      map(
        (rowContextMenuButtonTemplates) =>
          !!rowContextMenuButtonTemplates.length
      )
    );
  //#endregion BODY/FOOTER ROW CONTEXT MENU BUTTONS TEMPLATES

  //#region FILTERS TABLE CONTAINER
  @ViewChild('filtersTableContainer') set filtersTableContainerSetter(
    v: ElementRef<HTMLDivElement> | undefined
  ) {
    if (!v) return;
    this.filtersTableContainer.next(v.nativeElement);
  }
  private filtersTableContainer = new ReplaySubject<HTMLDivElement>();
  public filtersTableContainer$ = this.filtersTableContainer.asObservable();
  public _filtersTableContainerWidthChange = new Subject<ImpResizeEvent>();
  public filtersTableContainerWidthChange$ =
    this._filtersTableContainerWidthChange.asObservable();
  public _filtersTableContainerHeightChange = new Subject<ImpResizeEvent>();
  public filtersTableContainerHeightChange$ =
    this._filtersTableContainerHeightChange.asObservable();
  public _filtersTableContainerSizeChange = new Subject<ImpResizeEvent>();
  public filtersTableContainerSizeChange$ =
    this._filtersTableContainerSizeChange.asObservable();
  //#endregion FILTERS TABLE CONTAINER

  //#region TABLE
  @ViewChild('table') set tableSetter(
    v: ElementRef<HTMLTableElement> | undefined
  ) {
    if (!v) return;
    this.table.next(v.nativeElement);
  }
  private table = new ReplaySubject<HTMLTableElement>();
  public onScroll = new Subject<HTMLTableElement>();
  public _tableWidthChange = new Subject<ImpResizeEvent>();
  public tableWidthChange$ = this._tableWidthChange.asObservable();
  public _tableHeightChange = new Subject<ImpResizeEvent>();
  public tableHeightChange$ = this._tableHeightChange.asObservable();
  public _tableSizeChange = new Subject<ImpResizeEvent>();
  public tableSizeChange$ = this._tableSizeChange.asObservable();
  private onScroll$ = this.onScroll.pipe(
    switchMap((table) =>
      this.viewport$.pipe(
        take(1),
        map((viewport) => ({ table, viewport }))
      )
    ),
    tap(({ table }) => this.onScrollEmitter.emit(table)),
    map(({ table }) => table),
    share()
  );
  @Output('onScroll') onScrollEmitter: EventEmitter<HTMLTableElement> =
    new EventEmitter<HTMLTableElement>();
  //#endregion TABLE

  //#region ON HORIZONTAL SCROLL
  @Input() horizontalScrollDisabled: boolean = false;
  public onHorizontalScroll$ = merge(
    this.table.pipe(take(1), map(this.getHorizontalScrollInfo)),
    this.tableWidthChange$.pipe(
      map(({ element }) => this.getHorizontalScrollInfo(element))
    ),
    this.onScroll$.pipe(map(this.getHorizontalScrollInfo))
  ).pipe(
    startWith({
      scrollLeft: null as any,
      offsetWidth: null as any,
    }),
    pairwise(),
    filter(this.horizontalScrollHasChanged),
    map(([prev, curr]) => curr),
    share()
  );
  private getHorizontalScrollInfo(htmlElement: HTMLElement) {
    return {
      scrollLeft: htmlElement.scrollLeft,
      offsetWidth: htmlElement.offsetWidth,
    };
  }
  private horizontalScrollHasChanged([prev, curr]: [
    {
      scrollLeft: number;
      offsetWidth: number;
    },
    {
      scrollLeft: number;
      offsetWidth: number;
    }
  ]) {
    return (
      prev.scrollLeft != curr.scrollLeft || prev.offsetWidth != curr.offsetWidth
    );
  }
  //#endregion ON HORIZONTAL SCROLL

  //#region ON VERTICAL SCROLL
  public onVerticalScroll$ = merge(
    this.table.pipe(take(1), map(this.getVerticalScrollInfo)),
    this.tableHeightChange$.pipe(
      map(({ element }) => this.getVerticalScrollInfo(element))
    ),
    this.onScroll$.pipe(map(this.getVerticalScrollInfo))
  ).pipe(
    startWith({
      scrollTop: null as any,
      scrollHeight: null as any,
      offsetHeight: null as any,
    }),
    pairwise(),
    filter(this.verticalScrollHasChanged),
    map(([prev, curr]) => curr),
    share()
  );
  private getVerticalScrollInfo(htmlElement: HTMLElement) {
    return {
      scrollTop: htmlElement.scrollTop,
      scrollHeight: htmlElement.scrollHeight,
      offsetHeight: htmlElement.offsetHeight,
    };
  }
  private verticalScrollHasChanged([prev, curr]: [
    {
      scrollTop: number;
      scrollHeight: number;
      offsetHeight: number;
    },
    {
      scrollTop: number;
      scrollHeight: number;
      offsetHeight: number;
    }
  ]) {
    return (
      prev.scrollTop != curr.scrollTop || prev.offsetHeight != curr.offsetHeight
    );
  }
  //#endregion ON VERTICAL SCROLL

  //#region SCROLLING
  public scrolling$: Observable<boolean> = merge(
    merge(this.onHorizontalScroll$, this.onVerticalScroll$).pipe(
      map(() => true)
    ),
    merge(this.onHorizontalScroll$, this.onVerticalScroll$).pipe(
      debounceTime(250),
      map(() => false)
    )
  ).pipe(startWith(false), shareReplay({ bufferSize: 1, refCount: true }));

  public $scrolling = toSignal(this.scrolling$, { requireSync: true });
  //#endregion SCROLLING

  //#region COLUMNS ALLOWED TO FILTER
  public columnsAllowedToFilter$ = this.columnsConfigured$.pipe(
    map((columns) => columns.filter(({ allowFilter }) => allowFilter)),
    map((columns) => [
      ...columns.filter(
        ({ configuration }) =>
          configuration.frozen && configuration.frozenPosition === 'left'
      ),
      ...this.getUnfrozenColumns(columns),
      ...columns.filter(
        ({ configuration }) =>
          configuration.frozen && configuration.frozenPosition === 'right'
      ),
    ])
  );
  //#endregion COLUMNS ALLOWED TO FILTER

  //#region ORDERED COLUMNS
  public orderedColumns$ = combineLatest([
    this.columnsConfigured$.pipe(
      map((columns) =>
        columns.filter(
          ({ visible, configuration }) => visible && configuration.visible
        )
      )
    ),
    defer(() => this.getCompleteColumnsGroupsInMatrixProperties$),
  ]).pipe(
    map(([columns, columnsGroupsMatrix]) => ({
      columnsGroupsMatrix,
      hasColumns: columns.length > 0,
      frozenLeftColumns: this.getFrozenColumnsAt('left', columns),
      unfrozenColumns: this.getUnfrozenColumns(columns),
      frozenRightColumns: this.getFrozenColumnsAt('right', columns),
    })),
    map(({ columnsGroupsMatrix, ...orderedColumns }) => ({
      ...orderedColumns,
      columns: [
        ...orderedColumns.frozenLeftColumns.columns,
        ...orderedColumns.unfrozenColumns,
        ...orderedColumns.frozenRightColumns.columns,
      ],
      frozenLeftColumnsGroupsMatrix: columnsGroupsMatrix.map((columnsGroups) =>
        this.getFrozenColumnsGroupsAt('left', columnsGroups)
      ),
      unfrozenColumnsGroupsMatrix: columnsGroupsMatrix.map((columnsGroups) =>
        this.getUnfrozenColumnsGroups(columnsGroups)
      ),
      frozenRightColumnsGroupsMatrix: columnsGroupsMatrix.map((columnsGroups) =>
        this.getFrozenColumnsGroupsAt('right', columnsGroups)
      ),
    })),
    map((orderedColumns) => ({
      ...orderedColumns,
      notEmptyColumnsGroupsRowsCount:
        orderedColumns.unfrozenColumnsGroupsMatrix.filter(
          (columnsGroups) => columnsGroups.length
        ).length,
    })),
    map((orderedColumns) => ({
      ...orderedColumns,
      columnsGroupsRowsCount: Array.from({
        length:
          orderedColumns.frozenLeftColumnsGroupsMatrix.length ==
            orderedColumns.notEmptyColumnsGroupsRowsCount &&
          orderedColumns.frozenRightColumnsGroupsMatrix.length ==
            orderedColumns.notEmptyColumnsGroupsRowsCount
            ? orderedColumns.notEmptyColumnsGroupsRowsCount
            : 0,
      })
        .fill(null)
        .map((_, index) => index),
    })),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private getCompleteColumnsGroupsMatrix$: Observable<
    ImperiaTableV3ColumnsGroupDirective<TItem>[][]
  > = combineLatest([
    this.columnsConfigured$.pipe(
      map((columns) =>
        columns.filter(
          ({ visible, configuration }) => visible && configuration.visible
        )
      )
    ),
    this._columnsGroupsMatrix$,
  ]).pipe(
    switchMap(([columns, columnsGroupsMatrix]) =>
      combineLatest(
        columnsGroupsMatrix.map((colGroups) =>
          combineLatest(
            colGroups.map((directive) =>
              directive.columns$.pipe(
                map((columns) => ({
                  directive,
                  columns,
                }))
              )
            )
          )
        )
      ).pipe(
        map((data) =>
          data.map((colGroupsDirectives) =>
            columns.reduce<ImperiaTableV3ColumnsGroupDirective<TItem>[]>(
              (completeColumnsGroups, col) => {
                const colGroup = colGroupsDirectives.find(({ columns }) =>
                  columns.find(({ field }) => field === col.field)
                )?.directive;

                if (colGroup) {
                  if (completeColumnsGroups.length == 0) return [colGroup];
                  if (
                    completeColumnsGroups.find(
                      ({ key }) => key === colGroup.key
                    )
                  ) {
                    return completeColumnsGroups;
                  }
                  return [...completeColumnsGroups, colGroup];
                }
                if (!colGroup) {
                  if (completeColumnsGroups.length == 0) {
                    const columnGroupDirectiveToSet = runInInjectionContext(
                      this.injector,
                      () => new ImperiaTableV3ColumnsGroupDirective<TItem>(null)
                    );
                    columnGroupDirectiveToSet.keySetter(
                      `imp-columns-group-placeholder-${fieldToImperiaTableColumnClass(
                        col.field,
                        false
                      )}`
                    );
                    columnGroupDirectiveToSet.addColumn([col]);
                    return [
                      ...completeColumnsGroups,
                      columnGroupDirectiveToSet,
                    ];
                  }
                  const lastPositionedColumnsGroupIndex =
                    completeColumnsGroups.reduce(
                      (lastPositionedIndex, colGroup, index) =>
                        colGroupsDirectives.find(
                          ({ directive }) => directive.key === colGroup.key
                        )
                          ? index
                          : lastPositionedIndex,
                      -1
                    );
                  if (lastPositionedColumnsGroupIndex == -1) {
                    completeColumnsGroups[
                      completeColumnsGroups.length - 1
                    ].addColumn([col]);
                    return completeColumnsGroups;
                  }
                  const lastPlaceholderColumnsGroupIndex = completeColumnsGroups
                    .slice(lastPositionedColumnsGroupIndex)
                    .findIndex(
                      (colGroup) =>
                        !colGroupsDirectives.find(
                          ({ directive }) => directive.key === colGroup.key
                        )
                    );

                  if (lastPlaceholderColumnsGroupIndex == -1) {
                    const columnGroupDirectiveToSet = runInInjectionContext(
                      this.injector,
                      () => new ImperiaTableV3ColumnsGroupDirective<TItem>(null)
                    );
                    columnGroupDirectiveToSet.keySetter(
                      `imp-columns-group-placeholder-${fieldToImperiaTableColumnClass(
                        col.field,
                        false
                      )}`
                    );
                    columnGroupDirectiveToSet.addColumn([col]);
                    return [
                      ...completeColumnsGroups,
                      columnGroupDirectiveToSet,
                    ];
                  }
                  completeColumnsGroups[
                    lastPositionedColumnsGroupIndex +
                      lastPlaceholderColumnsGroupIndex
                  ]?.addColumn([col]);
                }
                return completeColumnsGroups;
              },
              []
            )
          )
        )
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private getCompleteColumnsGroupsInMatrixProperties$: Observable<
    ImperiaTableV3ColumnsGroupInMatrixProperties<TItem>[][]
  > = this.getCompleteColumnsGroupsMatrix$.pipe(
    switchMap((columnsGroupsMatrix) =>
      combineLatest(
        columnsGroupsMatrix.map((colGroups) =>
          combineLatest(
            colGroups.map((directive) =>
              combineLatest([
                directive.columns$,
                directive.frozen$,
                directive.frozenPosition$,
              ]).pipe(
                map(([columns, frozen, frozenPosition]) => ({
                  frozen,
                  frozenPosition,
                  columns,
                  directive,
                }))
              )
            )
          )
        )
      )
    ),
    startWith([]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private getFrozenColumnsGroupsAt(
    position: 'left' | 'right',
    allColumnsGroups: ImperiaTableV3ColumnsGroupInMatrixProperties<TItem>[]
  ) {
    return allColumnsGroups
      .filter(
        ({ frozen, frozenPosition }) => frozen && frozenPosition === position
      )
      .reduce(
        (
          { columnsGroups, positions },
          colGroup,
          index,
          frozenPositionColumnGroups
        ) => {
          const affectedByColumnsGroups =
            position == 'left'
              ? frozenPositionColumnGroups.slice(0, index)
              : frozenPositionColumnGroups.slice(index + 1);

          return {
            columnsGroups: [...columnsGroups, colGroup],
            positions: [
              ...positions,
              merge(
                ...affectedByColumnsGroups.map((colGroup) =>
                  merge(...colGroup.columns.map((col) => col.width$))
                )
              ).pipe(
                withLatestFrom(this.hasCellSelection$),
                map(
                  ([_, hasCellSelection]) =>
                    this.getWidthSum(
                      affectedByColumnsGroups.flatMap(
                        (columnGroup) => columnGroup.columns
                      )
                    ) +
                    (position === 'left' && hasCellSelection
                      ? this.ROW_COL_SELECTORS_SIZE
                      : 0) +
                    'px'
                ),
                mergeWith(
                  this.hasCellSelection$.pipe(
                    map(
                      (hasCellSelection) =>
                        this.getWidthSum(
                          affectedByColumnsGroups.flatMap(
                            (columnGroup) => columnGroup.columns
                          )
                        ) +
                        (position === 'left' && hasCellSelection
                          ? this.ROW_COL_SELECTORS_SIZE
                          : 0) +
                        'px'
                    )
                  )
                ),
                shareReplay({ bufferSize: 1, refCount: true })
              ),
            ],
          };
        },
        {
          columnsGroups:
            [] as ImperiaTableV3ColumnsGroupInMatrixProperties<TItem>[],
          positions: [] as Observable<string>[],
        }
      );
  }
  private getFrozenColumnsAt(
    position: 'left' | 'right',
    allColumns: ImperiaTableColumn<TItem>[]
  ) {
    return allColumns
      .filter(
        ({ configuration }) =>
          configuration.frozen && configuration.frozenPosition === position
      )
      .reduce(
        ({ columns, positions }, col, index, frozenPositionColumns) => {
          const affectedByColumns =
            position == 'left'
              ? frozenPositionColumns.slice(0, index)
              : frozenPositionColumns.slice(index + 1);

          return {
            columns: [...columns, col],
            positions: [
              ...positions,
              merge(...affectedByColumns.map((col) => col.width$)).pipe(
                withLatestFrom(this.hasCellSelection$),
                map(
                  ([_, hasCellSelection]) =>
                    this.getWidthSum(affectedByColumns) +
                    (position === 'left' && hasCellSelection
                      ? this.ROW_COL_SELECTORS_SIZE
                      : 0) +
                    'px'
                ),
                mergeWith(
                  this.hasCellSelection$.pipe(
                    map(
                      (hasCellSelection) =>
                        this.getWidthSum(affectedByColumns) +
                        (position === 'left' && hasCellSelection
                          ? this.ROW_COL_SELECTORS_SIZE
                          : 0) +
                        'px'
                    )
                  )
                ),
                shareReplay({ bufferSize: 1, refCount: true })
              ),
            ],
          };
        },
        {
          columns: [] as ImperiaTableColumn<TItem>[],
          positions: [] as Observable<string>[],
        }
      );
  }
  private getUnfrozenColumnsGroups(
    columnsGroups: ImperiaTableV3ColumnsGroupInMatrixProperties<TItem>[]
  ) {
    return columnsGroups.filter(({ frozen }) => !frozen);
  }
  private getUnfrozenColumns(columns: ImperiaTableColumn<TItem>[]) {
    return columns.filter(({ configuration }) => !configuration.frozen);
  }
  //#endregion ORDERED COLUMNS

  //#region COLUMN SCROLL INTO VIEW
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
    withLatestFrom(this.orderedColumns$, this.viewport$),
    map(([columnFieldToFocus, { unfrozenColumns }, viewport]) => ({
      columnFieldToFocus,
      unfrozenColumns,
      indexColumnToFocus: unfrozenColumns.findIndex(({ field }) =>
        field.includes(columnFieldToFocus)
      ),
      viewport,
    })),
    map(
      ({
        columnFieldToFocus,
        unfrozenColumns,
        indexColumnToFocus,
        viewport,
      }) => ({
        columnFieldToFocus,
        columnToFocusLeftOffset: this.getWidthSum(
          unfrozenColumns.slice(0, indexColumnToFocus)
        ),
        viewport,
      })
    ),
    tap(({ columnToFocusLeftOffset, viewport }) =>
      viewport.scrollable.scrollTo({
        left: columnToFocusLeftOffset,
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

  //#region ON COL WIDTH CHANGES
  private onColWidthChanges$ = this.orderedColumns$.pipe(
    switchMap(({ frozenLeftColumns, unfrozenColumns, frozenRightColumns }) =>
      merge(
        ...[
          ...frozenLeftColumns.columns,
          ...unfrozenColumns,
          ...frozenRightColumns.columns,
        ].map((col) => col.width$.pipe(skip(1)))
      ).pipe(
        withLatestFrom(this.hasCellSelection$),
        map(([_, hasCellSelection]) => ({
          frozenLeftColumnsWidth:
            this.getWidthSum(frozenLeftColumns.columns) +
            (hasCellSelection ? this.ROW_COL_SELECTORS_SIZE : 0),
          frozenRightColumnsWidth:
            this.getWidthSum(frozenRightColumns.columns) +
            (hasCellSelection ? this.ROW_COL_SELECTORS_SIZE : 0),
        })),
        mergeWith(
          this.hasCellSelection$.pipe(
            map((hasCellSelection) => ({
              frozenLeftColumnsWidth:
                this.getWidthSum(frozenLeftColumns.columns) +
                (hasCellSelection ? this.ROW_COL_SELECTORS_SIZE : 0),
              frozenRightColumnsWidth:
                this.getWidthSum(frozenRightColumns.columns) +
                (hasCellSelection ? this.ROW_COL_SELECTORS_SIZE : 0),
            }))
          )
        )
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion ON COL WIDTH CHANGES

  //#region PAGINATED COLUMNS
  private readonly PAGINATION_OFFSET = 400;
  public paginatedColumns$ = combineLatest([
    this.orderedColumns$,
    this.onHorizontalScroll$,
    this.onColWidthChanges$,
  ]).pipe(
    tap(([{ unfrozenColumnsGroupsMatrix }]) =>
      this.markColumnsAsLastInGroup(unfrozenColumnsGroupsMatrix)
    ),
    map(
      ([
        { unfrozenColumns, unfrozenColumnsGroupsMatrix },
        { scrollLeft, offsetWidth },
        { frozenLeftColumnsWidth, frozenRightColumnsWidth },
      ]) => ({
        unfrozenColumns,
        unfrozenColumnsGroupsMatrix,
        scrollLeft,
        frozenLeftColumnsWidth,
        frozenRightColumnsWidth,
        frozenColumnsOverflow:
          frozenLeftColumnsWidth + frozenRightColumnsWidth >
          offsetWidth - offsetWidth * 0.2,
        scrollRight:
          scrollLeft +
          offsetWidth -
          frozenLeftColumnsWidth -
          frozenRightColumnsWidth,
      })
    ),
    map(({ scrollLeft, scrollRight, ...paginatedColumns }) => ({
      ...paginatedColumns,
      unfrozenColumnsWidth: this.getWidthSum(paginatedColumns.unfrozenColumns),
      firstVisibleColumnIndex: this.getFirstVisibleColumnIndex(
        paginatedColumns.unfrozenColumns,
        scrollLeft,
        paginatedColumns.frozenColumnsOverflow,
        paginatedColumns.frozenLeftColumnsWidth
      ),
      lastVisibleColumnIndex: this.getLastVisibleColumnIndex(
        paginatedColumns.unfrozenColumns,
        scrollRight,
        paginatedColumns.frozenColumnsOverflow,
        paginatedColumns.frozenRightColumnsWidth
      ),
    })),
    map(({ ...paginatedColumns }) => ({
      ...paginatedColumns,
      firstVisibleColumnsGroupIndexes:
        paginatedColumns.unfrozenColumnsGroupsMatrix.map(
          (unfrozenColumnsGroups) =>
            this.getFirstVisibleColumnsGroupIndex(
              unfrozenColumnsGroups,
              paginatedColumns.unfrozenColumns[
                paginatedColumns.firstVisibleColumnIndex
              ]
            )
        ),
      lastVisibleColumnsGroupIndexes:
        paginatedColumns.unfrozenColumnsGroupsMatrix.map(
          (unfrozenColumnsGroups) =>
            this.getLastVisibleColumnsGroupIndex(
              unfrozenColumnsGroups,
              paginatedColumns.unfrozenColumns[
                paginatedColumns.lastVisibleColumnIndex
              ]
            )
        ),
    })),
    map(({ ...paginatedColumns }) => ({
      ...paginatedColumns,
      leftColumnsGroupsPlaceholdersWidths:
        paginatedColumns.unfrozenColumnsGroupsMatrix.map(
          (unfrozenColumnsGroups, index) =>
            this.getWidthSum(
              unfrozenColumnsGroups
                .slice(
                  0,
                  paginatedColumns.firstVisibleColumnsGroupIndexes[index]
                )
                .flatMap((colGroup) => colGroup.columns)
            ) + 'px'
        ),
      leftColumnsPlaceholderWidth:
        this.getWidthSum(
          paginatedColumns.unfrozenColumns.slice(
            0,
            paginatedColumns.firstVisibleColumnIndex
          )
        ) + 'px',
      columnsGroupsMatrix: paginatedColumns.unfrozenColumnsGroupsMatrix.map(
        (unfrozenColumnsGroups, index) =>
          unfrozenColumnsGroups.slice(
            paginatedColumns.firstVisibleColumnsGroupIndexes[index],
            paginatedColumns.lastVisibleColumnsGroupIndexes[index] + 1
          )
      ),
      columns: paginatedColumns.unfrozenColumns.slice(
        paginatedColumns.firstVisibleColumnIndex,
        paginatedColumns.lastVisibleColumnIndex + 1
      ),
      rightColumnsGroupsPlaceholdersWidths:
        paginatedColumns.unfrozenColumnsGroupsMatrix.map(
          (unfrozenColumnsGroups, index) =>
            this.getWidthSum(
              unfrozenColumnsGroups
                .slice(
                  paginatedColumns.lastVisibleColumnsGroupIndexes[index] + 1,
                  unfrozenColumnsGroups.length
                )
                .flatMap((colGroup) => colGroup.columns)
            ) + 'px'
        ),
      rightColumnsPlaceholderWidth:
        this.getWidthSum(
          paginatedColumns.unfrozenColumns.slice(
            paginatedColumns.lastVisibleColumnIndex + 1,
            paginatedColumns.unfrozenColumns.length
          )
        ) + 'px',
    })),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public getWidthSum(columns: ImperiaTableColumn<TItem>[]) {
    return columns.reduce(
      (width, col) => (width += col.width != 'auto' ? col.width : 0),
      0
    );
  }
  private getFirstVisibleColumnsGroupIndex(
    unfrozenColumnsGroups: ImperiaTableV3ColumnsGroupInMatrixProperties<TItem>[],
    firstVisibleColumn: ImperiaTableColumn<TItem>
  ) {
    const firstVisibleColumnIndex = unfrozenColumnsGroups.findIndex(
      (colGroup) => colGroup.columns.includes(firstVisibleColumn)
    );
    return firstVisibleColumnIndex > -1 ? firstVisibleColumnIndex : 0;
  }

  private markColumnsAsLastInGroup(
    unfrozenColumnsGroupsMatrix: ImperiaTableV3ColumnsGroupInMatrixProperties<TItem>[][]
  ) {
    unfrozenColumnsGroupsMatrix.forEach((unfrozenColumnsGroups) =>
      unfrozenColumnsGroups.forEach((colGroup) =>
        colGroup.columns.forEach((col, index, { length }) =>
          index == length - 1
            ? (col.isLastInGroup = true)
            : (col.isLastInGroup = false)
        )
      )
    );
  }

  private getFirstVisibleColumnIndex(
    unfrozenColumns: ImperiaTableColumn<TItem>[],
    scrollLeft: number,
    frozenColumnsOverflow: boolean,
    frozenLeftColumnsWidth: number
  ) {
    return (
      unfrozenColumns.reduce<{
        totalWidth: number;
        firstVisibleColumnIndex: number | null;
      }>(
        ({ totalWidth, firstVisibleColumnIndex }, col, index) => {
          totalWidth += col.width != 'auto' ? col.width : 0;
          return {
            totalWidth,
            firstVisibleColumnIndex:
              firstVisibleColumnIndex != null
                ? firstVisibleColumnIndex
                : totalWidth > scrollLeft - this.PAGINATION_OFFSET
                ? index
                : null,
          };
        },
        {
          totalWidth: frozenColumnsOverflow ? frozenLeftColumnsWidth : 0,
          firstVisibleColumnIndex: null,
        }
      ).firstVisibleColumnIndex ?? 0
    );
  }
  private getLastVisibleColumnsGroupIndex(
    unfrozenColumnsGroups: ImperiaTableV3ColumnsGroupInMatrixProperties<TItem>[],
    lastVisibleColumn: ImperiaTableColumn<TItem>
  ) {
    const lastVisibleColumnIndex = unfrozenColumnsGroups.findIndex((colGroup) =>
      colGroup.columns.includes(lastVisibleColumn)
    );
    return lastVisibleColumnIndex > -1
      ? lastVisibleColumnIndex
      : unfrozenColumnsGroups.length;
  }
  private getLastVisibleColumnIndex(
    unfrozenColumns: ImperiaTableColumn<TItem>[],
    scrollRight: number,
    frozenColumnsOverflow: boolean,
    frozenRightColumnsWidth: number
  ) {
    return (
      unfrozenColumns.reduce<{
        totalWidth: number;
        lastVisibleColumnIndex: number | null;
      }>(
        ({ totalWidth, lastVisibleColumnIndex }, col, index) => {
          totalWidth += col.width != 'auto' ? col.width : 0;
          return {
            totalWidth,
            lastVisibleColumnIndex:
              lastVisibleColumnIndex != null
                ? lastVisibleColumnIndex
                : totalWidth >= scrollRight + this.PAGINATION_OFFSET
                ? index
                : null,
          };
        },
        {
          totalWidth: frozenColumnsOverflow ? frozenRightColumnsWidth * -1 : 0,
          lastVisibleColumnIndex: null,
        }
      ).lastVisibleColumnIndex ?? unfrozenColumns.length
    );
  }
  //#endregion PAGINATED COLUMNS

  public onClickInsideEditCellElement = new BehaviorSubject<boolean>(false);
  public editCellElementIsClicked$: Observable<boolean> =
    this.onClickInsideEditCellElement.pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

  //#region ROW SELECTION
  @ContentChild(ImperiaTableV2RowSelectionComponent<TItem>)
  set imperiaTableV2RowSelectionComponentSetter(
    v: ImperiaTableV2RowSelectionComponent<TItem> | undefined
  ) {
    this.imperiaTableV2RowSelectionComponent.next(v);
  }
  public imperiaTableV2RowSelectionComponent = new ReplaySubject<
    ImperiaTableV2RowSelectionComponent<TItem> | undefined
  >(1);
  public hasRowSelection$ = this.imperiaTableV2RowSelectionComponent.pipe(
    map(
      (imperiaTableV2RowSelectionComponent) =>
        !!imperiaTableV2RowSelectionComponent
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public isRowSelectedFn$ = this.imperiaTableV2RowSelectionComponent.pipe(
    map(
      (imperiaTableV2RowSelectionComponent) =>
        imperiaTableV2RowSelectionComponent?.isSelected ?? (() => false)
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public rowSelection$ = combineLatest([
    this.imperiaTableV2RowSelectionComponent.pipe(
      distinctUntilChanged((prev, curr) => !!prev == !!curr)
    ),
    defer(() =>
      this.imperiaTableV2CellSelectionComponent.pipe(
        distinctUntilChanged((prev, curr) => !!prev == !!curr)
      )
    ),
  ]).pipe(
    switchMap(
      ([
        imperiaTableV2RowSelectionComponent,
        imperiaTableV2CellSelectionComponent,
      ]) =>
        imperiaTableV2RowSelectionComponent?.selection$ ??
        imperiaTableV2CellSelectionComponent?.selection$.pipe(
          withLatestFrom(this.rows$, this.footerRows$),
          map(([selection, rows, footerRows]) =>
            Array.from(selection.keys())
              .map(
                (dataKeyValue) =>
                  rows.find((row) => row.dataKeyValue === dataKeyValue)?.data ??
                  footerRows.find((row) => row.dataKeyValue === dataKeyValue)
                    ?.data
              )
              .filter((item): item is TItem => !!item)
          )
        ) ??
        of<TItem[]>([])
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion ROW SELECTION

  //#region CELL SELECTION
  private readonly ROW_COL_SELECTORS_SIZE = 29;
  @ContentChild(ImperiaTableV2CellSelectionComponent<TItem>)
  set imperiaTableV2CellSelectionComponentSetter(
    v: ImperiaTableV2CellSelectionComponent<TItem> | undefined
  ) {
    this.imperiaTableV2CellSelectionComponent.next(v);
  }
  public imperiaTableV2CellSelectionComponent = new ReplaySubject<
    ImperiaTableV2CellSelectionComponent<TItem> | undefined
  >(1);
  public hasCellSelection$ = this.imperiaTableV2CellSelectionComponent.pipe(
    map(
      (imperiaTableV2CellSelectionComponent) =>
        !!imperiaTableV2CellSelectionComponent
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public isCellSelectedFn$ = this.imperiaTableV2CellSelectionComponent.pipe(
    map(
      (imperiaTableV2CellSelectionComponent) =>
        imperiaTableV2CellSelectionComponent?.isSelected ?? (() => false)
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public cellSelection$ = combineLatest([
    this.imperiaTableV2CellSelectionComponent.pipe(
      distinctUntilChanged((prev, curr) => !!prev == !!curr)
    ),
    this.imperiaTableV2RowSelectionComponent.pipe(
      distinctUntilChanged((prev, curr) => !!prev == !!curr)
    ),
  ]).pipe(
    switchMap(
      ([
        imperiaTableV2CellSelectionComponent,
        imperiaTableV2RowSelectionComponent,
      ]) =>
        imperiaTableV2CellSelectionComponent?.selection$ ??
        imperiaTableV2RowSelectionComponent?.selection$.pipe(
          withValueFrom(this.orderedColumns$),
          map(
            ([selection, { columns }]) =>
              new Map(
                selection.map((item) => [
                  this.dataKeyValue(item),
                  columns.map(({ field }) => field),
                ])
              )
          )
        ) ??
        of<_ImperiaTableV2CellInternalSelection<TItem>>(new Map())
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion CELL SELECTION

  //#region SELECTION
  public isShiftPressed$ = combineLatest([
    this.imperiaTableV2RowSelectionComponent.pipe(
      switchMap((imperiaTableV2RowSelectionComponent) =>
        imperiaTableV2RowSelectionComponent
          ? imperiaTableV2RowSelectionComponent.isShiftPressed$
          : of(false)
      )
    ),
    this.imperiaTableV2CellSelectionComponent.pipe(
      switchMap((imperiaTableV2CellSelectionComponent) =>
        imperiaTableV2CellSelectionComponent
          ? imperiaTableV2CellSelectionComponent.isShiftPressed$
          : of(false)
      )
    ),
  ]).pipe(
    map(
      ([isShiftPressedRow, isShiftPressedCell]) =>
        isShiftPressedRow || isShiftPressedCell
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public hasSelection$ = combineLatest([
    this.hasRowSelection$,
    this.hasCellSelection$,
  ]).pipe(
    map(
      ([hasRowSelection, hasCellSelection]) =>
        hasRowSelection || hasCellSelection
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public hasRowDetail$ = of(false);
  //#endregion SELECTION

  //#region CLICKS
  @ContentChild(ImperiaTableV2ClicksDirective)
  set clicksComponentSetter(
    v: ImperiaTableV2ClicksDirective<TItem> | undefined
  ) {
    this.clicksComponent.next(v);
  }
  public clicksComponent = new ReplaySubject<
    ImperiaTableV2ClicksDirective<TItem> | undefined
  >(1);

  public hasClickEvents$ = this.clicksComponent.pipe(
    map((clicksComponent) => !!clicksComponent),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public lastCellClicked$: Observable<{
    col: ImperiaTableColumn<TItem>;
    row: ImperiaTableRow<TItem>;
  } | null> = this.imperiaTableV2CellSelectionComponent.pipe(
    startWith(null),
    pairwise(),
    filter(([prev, curr]) => !!prev !== !!curr),
    map(([prev, curr]) => curr),
    switchMap(
      (imperiaTableV2CellSelectionComponent) =>
        imperiaTableV2CellSelectionComponent?.lastCellClicked$ ?? of(null)
    ),
    startWith(null),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public click$ = this.clicksComponent.pipe(
    switchMap((clicksComponent) => clicksComponent?.click$ ?? EMPTY),
    share()
  );

  public singleClick$ = this.clicksComponent.pipe(
    switchMap((clicksComponent) => clicksComponent?.singleClick$ ?? EMPTY),
    share()
  );

  public doubleClick$ = this.clicksComponent.pipe(
    switchMap((clicksComponent) => clicksComponent?.doubleClick$ ?? EMPTY),
    share()
  );

  public contextMenu$ = this.clicksComponent.pipe(
    switchMap((clicksComponent) => clicksComponent?.contextMenu$ ?? EMPTY),
    share()
  );
  //#endregion CLICKS

  public async clickCell(
    event: MouseEvent,
    element: HTMLTableCellElement,
    {
      col,
      row,
      colIndex,
      rowIndex,
    }: ImperiaTableBodyCellTemplateContext['$implicit'],
    editMode: boolean,
    cell: ImperiaTableCell<any>
  ) {
    if (editMode && !col.dataInfo.readonly && row.editable) {
      cell.dataInfo.editing = true;
      return;
    }
    if (cell.dataInfo.editing) return;

    const imperiaTableV2WithClicksDirective = await firstValueFrom(
      this.clicksComponent
    );

    if (imperiaTableV2WithClicksDirective) {
      imperiaTableV2WithClicksDirective.click(
        event,
        element,
        row.fromFooter,
        row,
        rowIndex,
        col,
        colIndex
      );
    } else {
      const [imperiaTableV2RowSelection, imperiaTableV2CellSelection] =
        await Promise.all([
          firstValueFrom(this.imperiaTableV2RowSelectionComponent),
          firstValueFrom(this.imperiaTableV2CellSelectionComponent),
        ]);

      imperiaTableV2RowSelection?.select(event, row);
      imperiaTableV2CellSelection?.select(event, row, col);
    }
  }

  public async contextMenuCell(
    event: MouseEvent,
    element: HTMLTableCellElement,
    fromFooter: boolean,
    {
      col,
      row,
      colIndex,
      rowIndex,
    }: ImperiaTableBodyCellTemplateContext['$implicit']
  ) {
    (await firstValueFrom(this.clicksComponent))?.contextMenu(
      event,
      element,
      fromFooter,
      row,
      rowIndex,
      col,
      colIndex
    );
  }

  //#region EDIT / EDIT MODE
  public onCellSave = new EventEmitter<{
    event: ImperiaTableCellEditEvent<TItem>;
    fromFooter: boolean;
  }>();
  //TODO: REFACTOR A ESTO
  public onCellSave$: Observable<ImperiaTableCellSaveEvent<TItem>> =
    this.onCellSave
      .pipe(
        map(({ event, fromFooter }) => ({
          event,
          fromFooter,
          cell: event.row.cells[event.col.field],
        })),
        filter(({ cell }) => cell.control.dirty && !cell.control.invalid),
        withLatestFrom(
          this.rowSelection$,
          this.footerRows$,
          this.isRowSelectedFn$
        ),
        map(
          ([
            { event, fromFooter, cell },
            currentSelection,
            footerRows,
            isSelectedFn,
          ]) => ({
            field: event.col.field,
            isSelected: isSelectedFn(event.row, currentSelection),
            oldItem: event.row.data,
            newItem: {
              ...event.row.data,
              [event.col.field]: cell.control.value,
            },
            oldValue: event.row.data[event.col.field],
            newValue: cell.control.value,
            control: cell.control,
            fromFooter,
            row: event.row,
            col: event.col,
            footerRow: footerRows[0] ?? null,
            set: (data: Partial<TItem>) => {
              Object.assign(event.row.data, data);

              // Iterar todas las celdas
              keys(event.row.cells).forEach((key) => {
                //Se actualiza el valor de la celda
                event.row.cells[key].value =
                  data[key] ?? event.row.cells[key].value;
                //Se actualiza el valor del control
                event.row.cells[key].control.setValue(
                  event.row.cells[key].value,
                  {
                    emitEvent: false,
                  }
                );
              });

              this.onRowRenderEmitter.emit(event.row);
            },
            setDataSyncState: (
              action: ImperiaFormDataSyncAction,
              state: ImperiaFormDataSyncState
            ) => {
              event.result(
                state === 'saved'
                  ? { loading: false, ok: true }
                  : state === 'error'
                  ? { loading: false, ok: false }
                  : { loading: false, canceled: true }
              );
              this.onRowRenderEmitter.emit(event.row);
            },
          })
        )
      )
      .pipe(share());

  @Input('allowEdit') allowEdit: boolean | null = null;
  @Output('onCellSave') onCellSaveEmitter: Observable<
    ImperiaTableCellSaveEvent<TItem>
  > = this.onCellSave$;
  public get editAllowed() {
    if (this.allowEdit == false) return false;
    if (!this.onCellSave.observed) return false;
    return true;
  }
  @Input('editMode') set editModeSetter(v: boolean | null) {
    this.editMode.next(!!v);
  }
  @Output('editModeChange')
  editModeEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  public editMode: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public editMode$ = this.editMode.pipe(
    distinctUntilChanged(),
    tap((editMode) => this.editModeEmitter.emit(editMode)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion EDIT / EDIT MODE

  //#region TITLE
  public $titleTemplate = contentChild<TemplateRef<any>>('titleTemplate');
  @Input('title') title: string | null = null;
  //#endregion TITLE

  //#region FILTERS
  /**
   * @deprecated
   */
  public toggleFilters = new Subject<void>();
  /**
   * @deprecated Use `<imperia-table-v2-filters>` instead
   */
  @Input('allowFilters') set allowFiltersSetter(v: boolean | null) {
    if (v == null) return;
    this.allowFilters.next(v);
  }
  private allowFilters = new BehaviorSubject<boolean>(false);
  @ContentChild(ImperiaTableV3FiltersComponent) set imperiaTableV3FiltersSetter(
    v: ImperiaTableV3FiltersComponent<TItem> | undefined
  ) {
    this.imperiaTableV3FiltersComponent.next(v);
  }
  private imperiaTableV3FiltersComponent = new ReplaySubject<
    ImperiaTableV3FiltersComponent<TItem> | undefined
  >(1);
  public imperiaTableV3FiltersComponent$ =
    this.imperiaTableV3FiltersComponent.pipe(
      distinctUntilChanged((prev, curr) => !!prev == !!curr),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  public hasImperiaTableV3Filters$ = this.imperiaTableV3FiltersComponent$.pipe(
    map((imperiaTableV3FiltersComponent) => !!imperiaTableV3FiltersComponent),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public hasImperiaTableFilterV2$ = this.hasImperiaTableV3Filters$;
  public imperiaTableV3FiltersHeaderCellButtonsTemplate$ =
    this.imperiaTableV3FiltersComponent$.pipe(
      switchMap(
        (imperiaTableV3FiltersComponent) =>
          imperiaTableV3FiltersComponent?.headerCellButtonsTemplate$ ?? of(null)
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  public imperiaTableV3FiltersHeaderCellIconsTemplate$ =
    this.imperiaTableV3FiltersComponent$.pipe(
      switchMap(
        (imperiaTableV3FiltersComponent) =>
          imperiaTableV3FiltersComponent?.headerCellIconsTemplate$ ?? of(null)
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  public imperiaTableV3FiltersBodyCellButtonsTemplate$ =
    this.imperiaTableV3FiltersComponent$.pipe(
      switchMap(
        (imperiaTableV3FiltersComponent) =>
          imperiaTableV3FiltersComponent?.bodyCellButtonsTemplate$ ?? of(null)
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  public imperiaTableV3FiltersOpened$ =
    this.imperiaTableV3FiltersComponent$.pipe(
      switchMap(
        (imperiaTableV3FiltersComponent) =>
          imperiaTableV3FiltersComponent?.componentToggle.value$ ?? of(false)
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  @Output() onFilterChanges = new EventEmitter<
    ImperiaTableFilterSortScrollEvent<TItem>
  >();
  //#endregion FILTERS

  //#region SORT
  /**
   * @deprecated Use `<imperia-table-v2-sort>` instead
   */
  @Input() allowSort: boolean | null = null;
  @ContentChild(ImperiaTableV3SortComponent) set imperiaTableV3SortSetter(
    v: ImperiaTableV3SortComponent<TItem> | undefined
  ) {
    this.imperiaTableV3SortComponent.next(v);
  }
  private imperiaTableV3SortComponent = new ReplaySubject<
    ImperiaTableV3SortComponent<TItem> | undefined
  >(1);
  public imperiaTableV3SortComponent$ = this.imperiaTableV3SortComponent.pipe(
    distinctUntilChanged((prev, curr) => !!prev == !!curr),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public hasImperiaTableV3Sort$ = this.imperiaTableV3SortComponent.pipe(
    map((imperiaTableV3SortComponent) => !!imperiaTableV3SortComponent),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public imperiaTableV3SortButtonsTemplate$ =
    this.imperiaTableV3SortComponent$.pipe(
      switchMap(
        (imperiaTableV3SortComponent) =>
          imperiaTableV3SortComponent?.buttonsTemplate$ ?? of(null)
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  public imperiaTableV3SortIconsTemplate$ =
    this.imperiaTableV3SortComponent$.pipe(
      switchMap(
        (imperiaTableV3SortComponent) =>
          imperiaTableV3SortComponent?.iconsTemplate$ ?? of(null)
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  @Output() onSortChanges = new EventEmitter<
    ImperiaTableFilterSortScrollEvent<TItem>
  >();
  //#endregion SORT

  //#region SEARCH
  /**
   * @deprecated Use `<imperia-table-v2-search>` instead
   */
  @Input() allowSearch: boolean | null = null;
  @ContentChild(ImperiaTableV3SearchComponent) set imperiaTableV3SearchSetter(
    v: ImperiaTableV3SearchComponent | undefined
  ) {
    this.imperiaTableV3SearchComponent.next(v);
  }
  private imperiaTableV3SearchComponent = new ReplaySubject<
    ImperiaTableV3SearchComponent | undefined
  >(1);
  public imperiaTableV3SearchComponent$ =
    this.imperiaTableV3SearchComponent.pipe(
      distinctUntilChanged((prev, curr) => !!prev == !!curr),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  public hasImperiaTableV3SearchComponent$ =
    this.imperiaTableV3SearchComponent.pipe(
      map((imperiaTableV3SearchComponent) => !!imperiaTableV3SearchComponent),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  @Output() onSearchChanges = new EventEmitter<
    ImperiaTableFilterSortScrollEvent<TItem>
  >();
  //#endregion SEARCH

  //#region PAGINATION
  @Input('allowPagination') set allowPaginationSetter(v: boolean | null) {
    if (v == null) return;
    this.allowPagination.next(v);
  }
  private allowPagination = new BehaviorSubject<boolean>(false);

  $imperiaTableV3PaginationComponent = contentChild(
    IMPERIA_TABLE_V3_PAGINATION_PROVIDER
  );
  public imperiaTableV3PaginationComponent$ = toObservable(
    this.$imperiaTableV3PaginationComponent
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  $hasPaginationProvider = computed(() => {
    const component = this.$imperiaTableV3PaginationComponent();
    return !!component;
  });

  $paginationConfig = computed(() => {
    const component = this.$imperiaTableV3PaginationComponent();
    const manual = component instanceof ImperiaTableV3ManualPaginationComponent;
    return {
      manual,
      rowButtonTemplate: manual ? component.$buttonRowTemplate : null,
    };
  });

  public paginationAllowed$ = combineLatest([
    this.allowPagination,
    toObservable(this.$hasPaginationProvider),
  ]).pipe(map((conditions) => conditions.every((c) => c)));
  @Output() onPageChanges = new EventEmitter<
    ImperiaTableFilterSortScrollEvent<TItem>
  >();
  //#endregion PAGINATION

  //#region PASTE
  @ContentChild(ImperiaTableV2PasteComponent)
  set imperiaTableV2PasteComponentSetter(
    v: ImperiaTableV2PasteComponent<TItem> | undefined
  ) {
    this.imperiaTableV2PasteComponent.next(v);
  }
  private imperiaTableV2PasteComponent = new ReplaySubject<
    ImperiaTableV2PasteComponent<TItem> | undefined
  >(1);
  public imperiaTableV2PasteComponent$ = this.imperiaTableV2PasteComponent.pipe(
    distinctUntilChanged((prev, curr) => !!prev == !!curr),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public hasImperiaTableV2PasteComponent$ =
    this.imperiaTableV2PasteComponent.pipe(
      map((imperiaTableV2PasteComponent) => !!imperiaTableV2PasteComponent),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  public pasting$ = this.imperiaTableV2PasteComponent$.pipe(
    switchMap((imperiaTableV2PasteComponent) =>
      imperiaTableV2PasteComponent
        ? imperiaTableV2PasteComponent.pasting$
        : EMPTY
    ),
    tap(() =>
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      })
    ),
    share()
  );
  //#endregion PASTE

  //#region LOADING
  @ContentChild(ImperiaTableV3LoadingComponent)
  set imperiaTableV3LoadingComponentSetter(
    v: ImperiaTableV3LoadingComponent | undefined
  ) {
    this.imperiaTableV3LoadingComponent.next(v);
  }
  private imperiaTableV3LoadingComponent = new ReplaySubject<
    ImperiaTableV3LoadingComponent | undefined
  >(1);

  public imperiaTableV3LoadingComponent$ =
    this.imperiaTableV3LoadingComponent.pipe(
      distinctUntilChanged((prev, curr) => !!prev == !!curr),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  public hasImperiaTableV3LoadingComponent$ =
    this.imperiaTableV3LoadingComponent$.pipe(
      map((imperiaTableV3LoadingComponent) => !!imperiaTableV3LoadingComponent),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  public imperiaTableV3LoadingTopTemplate$ =
    this.imperiaTableV3LoadingComponent$.pipe(
      switchMap(
        (imperiaTableV3LoadingComponent) =>
          imperiaTableV3LoadingComponent?.topTemplate$ ?? of(null)
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  public imperiaTableV3LoadingBottomTemplate$ =
    this.imperiaTableV3LoadingComponent$.pipe(
      switchMap(
        (imperiaTableV3LoadingComponent) =>
          imperiaTableV3LoadingComponent?.bottomTemplate$ ?? of(null)
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  public loading$ = this.imperiaTableV3LoadingComponent$.pipe(
    switchMap(
      (imperiaTableV3LoadingComponent) =>
        imperiaTableV3LoadingComponent?.value$ ??
        of(new ImperiaTableLoading(false))
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  /**
   * @deprecated Use `<imperia-table-v2-loading>` instead
   */
  @Input('loading') _loading: ImperiaTableLoading<boolean> | null = null;
  //#endregion LOADING

  //#region BLOCKED
  @ContentChild(ImperiaTableV2BlockerTemplateDirective)
  public outsideBlockerTemplate:
    | ImperiaTableV2BlockerTemplateDirective
    | undefined;
  @Input('blocked') set blockedSetter(v: ImperiaTableBlock<boolean> | null) {
    if (v == null) return;
    this.blocked.next(v);
  }
  private blocked = new ReplaySubject<ImperiaTableBlock>(1);
  public blocked$: Observable<ImperiaTableBlock> = merge(
    this.blocked,
    this.imperiaTableV2PasteComponent$.pipe(
      switchMap((imperiaTableV2PasteComponent) =>
        imperiaTableV2PasteComponent
          ? merge(
              imperiaTableV2PasteComponent.onPaste$.pipe(
                map(
                  () =>
                    new ImperiaTableBlock({
                      state: true,
                      from: 'paste',
                    })
                )
              ),
              imperiaTableV2PasteComponent.onPasteEnd$.pipe(
                delay(1000, animationFrameScheduler),
                map(() => new ImperiaTableBlock(false))
              )
            ).pipe(
              tap(() =>
                setTimeout(() => {
                  this.cdr.markForCheck();
                  this.cdr.detectChanges();
                })
              )
            )
          : EMPTY
      )
    )
  ).pipe(
    startWith(new ImperiaTableBlock(false)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion BLOCKED

  //#region CAN CLOSE CONTEXT MENU
  public canCloseContextMenu$ = combineLatest([
    this.imperiaTableV2RowSelectionComponent.pipe(
      switchMap((imperiaTableV2RowSelectionComponent) =>
        imperiaTableV2RowSelectionComponent
          ? imperiaTableV2RowSelectionComponent.copyingRows$.pipe(
              map(({ state }) => !state)
            )
          : of(true)
      )
    ),
  ]).pipe(map((conditions) => conditions.every((condition) => !!condition)));
  //#endregion CAN CLOSE CONTEXT MENU

  //#region CAPTION MENU VISIBLE
  public captionMenuVisible$ = combineLatest([
    this.adjustColumnsToContentAllowed$,
    this.hasDeletion$,
    this.hasColumnsConfigurator$,
    this.hasImperiaTableV3Filters$,
    this.hasRowsConfigurator$,
    this.menuGroupsChanges$.pipe(map(({ length }) => !!length)),
  ]).pipe(map((items) => items.some((item) => item)));
  //#endregion CAPTION MENU VISIBLE

  //#region GET CELL ELEMENT REF
  @ViewChild('body') body!: ElementRef<HTMLTableSectionElement>;
  @ViewChild('foot') foot!: ElementRef<HTMLTableSectionElement>;
  public getCellElementRef(
    dataKeyValue: ImperiaTableRow<TItem>['dataKeyValue'],
    field: TImperiaTableColumnField<TItem>
  ): HTMLTableCellElement | null {
    const row =
      this.body.nativeElement.querySelector(
        `tr[data-data-key-value="${dataKeyValue}"]`
      ) ??
      this.foot.nativeElement.querySelector(
        `tr[data-data-key-value="${dataKeyValue}"]`
      );
    if (!row) return null;
    return row.querySelector(`td[data-field="${field}"]`);
  }
  //#endregion GET CELL ELEMENT REF

  constructor(
    private el: ElementRef,
    public cdr: ChangeDetectorRef
  ) {}

  public dataKeyValue(
    item: TItem
  ): number | TItem[TImperiaTableColumnField<TItem>] {
    return Array.isArray(this.dataKey)
      ? createHash(this.dataKey.map((key) => item[key]).join(':'))
      : item[this.dataKey];
  }

  public colGroupTrackByFn(
    index: number,
    colGroup: ImperiaTableV3ColumnsGroupInMatrixProperties<TItem>
  ) {
    return colGroup.directive.key ?? index;
  }

  public colTrackByFn(_: number, col: ImperiaTableColumn<TItem>) {
    return col.field;
  }

  public rowTrackByFn(_: number, row: ImperiaTableRow<TItem>) {
    return row.dataKeyValue;
  }

  // * Unused function
  public onDateInputChange(event: Date, control: FormControl) {
    control.setValue(UTC(dayjs(event)).format('YYYY-MM-DDT00:00:00'));
  }

  public getWidth(col: ImperiaTableColumn<TItem>): string {
    const width = col.width != 'auto' ? col.width + col.widthUnit : col.width;
    if (col.dataInfo.editing && col.dataInfo.editingColWidth) {
      return col.dataInfo.editingColWidth + col.widthUnit;
    }
    return width;
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

  public filterByValue(
    imperiaTableV2FiltersComponent: ImperiaTableV3FiltersComponent<TItem>,
    col: ImperiaTableColumn<TItem>,
    row: ImperiaTableRow<TItem>,
    close: () => void
  ) {
    const value = row.data[col.field];
    if (typeof value == 'string' && col.dataInfo.type == 'date') {
      col.setFilters(new Date(value), FilterOperator.EQUAL);
    } else {
      col.setFilters(value, FilterOperator.EQUAL);
    }
    imperiaTableV2FiltersComponent.addFilter.next(
      col.asFilter({ columnAsString: false }) as any
    );
    close();
  }
}
