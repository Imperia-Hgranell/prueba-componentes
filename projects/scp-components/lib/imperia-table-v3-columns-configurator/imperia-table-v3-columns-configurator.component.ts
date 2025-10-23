import { CdkAccordionModule } from '@angular/cdk/accordion';
import {
  CdkDragDrop,
  CdkDragHandle,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { AsyncPipe, CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { modal } from '@imperiascm/rxjs-utils';
import {
  defer,
  filter,
  map,
  merge,
  Observable,
  ReplaySubject,
  scan,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import {
  EXPAND_VERTICALLY,
  FADEIN_FADEOUT,
} from '@imperiascm/scp-utils/animations';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';
import { ImpDialogComponent } from '../imp-dialog/imp-dialog.component';
import { ImpSectionModule } from '../imp-section/imp-section.module';
import { ColumnConfiguration } from '../imperia-table/models/imperia-table-v2-columns-configurator.models';
import { ImperiaTableColumn } from '../imperia-table/models/imperia-table-columns.models';
import { ImperiaTableV3Component } from '../imperia-table-v3/components/imperia-table-v3/imperia-table-v3.component';
import { TImperiaTableColumnDataInfoTypes } from '../imperia-table/models/imperia-table-columns.types';
import { ImpTooltipDirective } from '../directives/imp-tooltip.directive';
import { ImperiaTableColumnDefaultConfigurationDirective } from '../directives/imperia-table-column-default-configuration.directive';
import { EntriesPipe } from '@imperiascm/scp-components/pipes';
import { ImperiaTableV3ColumnsConfiguratorTagDirective } from '@imperiascm/scp-components/directives';
import { ImpTranslateService } from '@imperiascm/translate';

enum frozenPosition {
  LEFT = 'left',
  RIGHT = 'right',
}
@Component({
  selector: 'imperia-table-v3-columns-configurator',
  standalone: true,
  animations: [FADEIN_FADEOUT, EXPAND_VERTICALLY],
  imports: [
    ImperiaIconButtonComponent,
    ImpDialogComponent,
    AsyncPipe,
    CdkDragHandle,
    ImpTooltipDirective,
    DragDropModule,
    CommonModule,
    EntriesPipe,
    ImpSectionModule,
    CdkAccordionModule,
  ],
  templateUrl: './imperia-table-v3-columns-configurator.component.html',
  styleUrl: './imperia-table-v3-columns-configurator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImperiaTableV3ColumnsConfiguratorComponent<TItem extends object> {
  //#region TRANSLATIONS
  public readonly TRANSLATIONS =
    this.typedTranslateService.translation.IMPERIA_TABLE;
  public COLUMNS_CONFIGURATOR_TRANSLATIONS =
    this.TRANSLATIONS.columns_configurator;
  //#endregion TRANSLATIONS

  //#region TAGS
  tags = contentChildren(ImperiaTableV3ColumnsConfiguratorTagDirective);
  tags$ = toObservable(this.tags);
  //#endregion TAGS

  //#region MODAL
  public readonly modal = modal({
    opened: () => ({ visible: true }),
    closed: () => ({ visible: false }),
  });
  //#endregion MODAL

  //#region DEFAULT COLUMNS CONFIGURATION
  public readonly DEFAULT_COL_CONFIG: Omit<ColumnConfiguration, 'field'> = {
    frozen: false,
    frozenPosition: frozenPosition.LEFT,
    visible: true,
  };

  $defaultColumnsConfiguration = contentChildren(
    ImperiaTableColumnDefaultConfigurationDirective,
    { descendants: true }
  );

  defaultColumnsConfiguration$ = toObservable(
    this.$defaultColumnsConfiguration
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion DEFAULT COLUMNS CONFIGURATION

  //#region RESET
  public reset = new Subject<void>();
  private onReset$ = this.reset.pipe(
    switchMap(() => this.imperiaTable.columns$),
    tap((columns) =>
      columns.forEach((col) => {
        if (col.configurable) {
          col.configuration.visible = col.visible;
          col.configuration.frozen = col.frozen;
        }
      })
    ),
    this.applyDefaultConfig()
  );
  //#endregion RESET

  //#region SWAP COLUMNS
  public swap = new Subject<{
    col: ImperiaTableColumn<TItem>;
    swapWith: 'previous' | 'next';
  }>();
  public swapColumns$ = this.swap.pipe(
    this.allColumns$(),
    map(
      ([
        { col, swapWith },
        leftFrozenColumns,
        nonFrozenColumns,
        rightFrozenColumns,
        hiddenColumns,
      ]) => {
        const indexToMove = swapWith === 'previous' ? -1 : 1;

        const cols = {
          leftFrozenColumns,
          nonFrozenColumns,
          rightFrozenColumns,
        };

        const colSection =
          col.configuration.frozen === false
            ? 'nonFrozenColumns'
            : col.configuration.frozenPosition === frozenPosition.LEFT
            ? 'leftFrozenColumns'
            : 'rightFrozenColumns';

        const columnIndex = cols[colSection].findIndex(
          ({ field }) => field === col.field
        );

        //if columns can not be swapped, return all columns
        if (
          !this.canBeSwapped(
            columnIndex,
            columnIndex + indexToMove,
            cols[colSection]
          )
        )
          return [
            ...leftFrozenColumns,
            ...nonFrozenColumns,
            ...rightFrozenColumns,
            ...hiddenColumns,
          ];

        this.swapColumns(
          cols[colSection],
          columnIndex,
          columnIndex + indexToMove
        );
        return [
          ...leftFrozenColumns,
          ...nonFrozenColumns,
          ...rightFrozenColumns,
          ...hiddenColumns,
        ];
      }
    )
  );
  //#endregion SWAP COLUMNS

  //#region DROP ELEMENT
  public drop = new ReplaySubject<CdkDragDrop<ImperiaTableColumn<TItem>[]>>();
  public drop$ = this.drop.pipe(
    this.allColumns$(),
    map(
      ([
        event,
        leftFrozenColumns,
        nonFrozenColumns,
        rightFrozenColumns,
        hiddenColumns,
      ]) => {
        //todo: comprobations previous begin to move anything
        const columnFrozenConfig: {
          [k: string]: { frozen: boolean; frozenPosition: 'left' | 'right' };
        } = {
          leftFrozenColumns: {
            frozen: true,
            frozenPosition: 'left',
          },
          nonFrozenColumns: {
            frozen: false,
            frozenPosition: 'left',
          },
          rightFrozenColumns: {
            frozen: true,
            frozenPosition: 'right',
          },
        };

        const containerData: { [k: string]: any[] } = {
          leftFrozenColumns,
          nonFrozenColumns,
          rightFrozenColumns,
        };

        event.item.data.configuration.frozen =
          columnFrozenConfig[event.container.id].frozen;
        event.item.data.configuration.frozenPosition =
          columnFrozenConfig[event.container.id].frozenPosition;
        containerData[event.previousContainer.id],
          containerData[event.container.id];

        if (
          !this.canBeDropped(
            containerData[event.previousContainer.id],
            containerData[event.container.id],
            event.previousIndex,
            event.currentIndex
          )
        )
          return [
            ...leftFrozenColumns,
            ...nonFrozenColumns,
            ...rightFrozenColumns,
            ...hiddenColumns,
          ];

        if (event.previousContainer === event.container) {
          moveItemInArray(
            containerData[event.container.id],
            event.previousIndex,
            event.currentIndex
          );
        } else {
          transferArrayItem(
            containerData[event.previousContainer.id],
            containerData[event.container.id],
            event.previousIndex,
            event.currentIndex
          );
        }

        return [
          ...leftFrozenColumns,
          ...nonFrozenColumns,
          ...rightFrozenColumns,
          ...hiddenColumns,
        ];
      }
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion DROP ELEMENT

  //#region VISIBILITY
  public toggleVisibility = new Subject<{
    columns: ImperiaTableColumn<TItem>[];
    columnSelected: ImperiaTableColumn<TItem>;
  }>();
  public onToggleVisibility$ = this.toggleVisibility.pipe(
    map(({ columns, columnSelected }) => {
      const column = columns.find((col) => col.field === columnSelected.field);
      if (column) column.configuration.visible = !column.configuration.visible;
      return columns;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion VISIBILITY

  //#region COLUMNS FROM TABLE
  public columnsFromTable$ = this.imperiaTable.columns$.pipe(
    this.applyDefaultConfig(),
    this.applyStorageConfiguration(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion COLUMNS FROM TABLE

  //#region COLUMNS
  @Output('onColumnsConfigurationChange') public columnsConfigured$: Observable<
    ImperiaTableColumn<TItem>[]
  > = merge(
    this.columnsFromTable$,
    this.drop$,
    this.onToggleVisibility$,
    this.onReset$,
    this.swapColumns$
  ).pipe(
    withLatestFrom(this.imperiaTable.storageKey),
    tap(([columns, storageKey]) =>
      this.setColumnsConfigurationToStorage(storageKey, columns)
    ),
    map(([columns]) => columns),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public columnsToConfigure$: Observable<ImperiaTableColumn<TItem>[]> =
    this.columnsConfigured$.pipe(
      map((columns) => columns.filter(({ visible }) => visible)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  //#endregion COLUMNS

  //#region VISIBLE COLUMNS
  public visibleColumns$: Observable<ImperiaTableColumn<TItem>[]> =
    this.columnsToConfigure$.pipe(
      map((columns) => columns.filter((col) => col.configuration.visible))
    );
  //#endregion VISIBLE COLUMNS

  //#region HIDDEN COLUMNS
  public hiddenColumns$ = this.columnsToConfigure$.pipe(
    map((columns) => columns.filter((col) => !col.configuration.visible)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public hiddenColumnsGrouppedByTag$ = this.hiddenColumns$.pipe(
    filter(() => !!this.tags()),
    map((columns) => {
      const DEFAULT_TAG = 'default';
      if (!this.tags()) return { DEFAULT_TAG: columns };
      const colsGroupedByTag: Record<string, ImperiaTableColumn<TItem>[]> = {};
      this.tags().forEach((tag) => {
        const colsTag = columns.filter((col) =>
          tag.$taggedColumns().includes(col.field)
        );
        if (colsTag.length > 0) {
          colsGroupedByTag[tag.$tagName()] = colsTag;
        }
        columns = columns.filter(
          (col) => !tag.$taggedColumns().includes(col.field)
        );
      });
      if (columns.length > 0) {
        colsGroupedByTag[DEFAULT_TAG] = columns;
      }

      return colsGroupedByTag;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion HIDDEN COLUMNS

  //#region SELECTED GROUP
  selectedGroup = new Subject<string | null>();

  selectedGroup$ = this.selectedGroup.pipe(
    scan((openState, clicked) => {
      return openState === clicked ? null : clicked;
    }, null as null | string),
    startWith(this.tags()[0]?.$tagName() ?? 'default'),

    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion SELECTED GROUP

  //#region FROZEN LEFT COLUMNS
  public frozenLeftColumns$: Observable<ImperiaTableColumn<TItem>[]> =
    this.visibleColumns$.pipe(
      map((columns) =>
        columns.filter(
          (col) =>
            col.configuration.frozen &&
            col.configuration.frozenPosition === frozenPosition.LEFT
        )
      )
    );
  //#endregion FROZEN LEFT COLUMNS

  //#region NON FORZEN COLUMNS
  public nonFrozenColumns$: Observable<ImperiaTableColumn<TItem>[]> =
    this.visibleColumns$.pipe(
      map((columns) => columns.filter((col) => !col.configuration.frozen))
    );
  //#endregion NON FORZEN COLUMNS

  //#region FROZEN RIGHT COLUMNS
  public frozenRightColumns$: Observable<ImperiaTableColumn<TItem>[]> =
    this.visibleColumns$.pipe(
      map((columns) =>
        columns.filter(
          (col) =>
            col.configuration.frozen &&
            col.configuration.frozenPosition === frozenPosition.RIGHT
        )
      )
    );
  //#endregion FROZEN RIGHT COLUMNS

  //#region HEADER COLUMNS CONFIGURATION BUTTONS TEMPLATES
  @ViewChild('columnPositionActions')
  set columnPositionActionsSetter(v: TemplateRef<any>) {
    if (!v) return;
    this.columnPositionActions$.next(v);
  }
  columnPositionActions$ = new ReplaySubject<TemplateRef<any>>();

  @ViewChild('columnVisibilityActions')
  set columnVisibilityActionsSetter(v: TemplateRef<any>) {
    if (!v) return;
    this.columnVisibilityActions$.next(v);
  }
  columnVisibilityActions$ = new ReplaySubject<TemplateRef<any>>();

  //#endregion HEADER COLUMNS CONFIGURATION BUTTONS TEMPLATES

  constructor(
    private imperiaTable: ImperiaTableV3Component<TItem>,
    private typedTranslateService: ImpTranslateService
  ) {}

  //#region HELPERS

  /**
   * This helper method is used by the imperia-table
   * to merge storage columns with the columns of the table.
   * @param columns
   * @param columnsFromStorage
   * @returns ImperiaTableColumn<TItem>[]
   */
  public applyColumnsConfiguration(
    columns: ImperiaTableColumn<TItem>[],
    columnsFromStorage: ColumnConfiguration[]
  ): ImperiaTableColumn<TItem>[] {
    const matchedColumns = columns.filter((col) => !col.configurable);
    columnsFromStorage.forEach((columnFromStorage) => {
      const columnToMatch = columns.find(
        (col) => col.field === columnFromStorage.field
      );
      if (columnToMatch) {
        columnToMatch.configuration.visible = columnFromStorage.visible;
        columnToMatch.configuration.frozen = columnFromStorage.frozen;
        columnToMatch.configuration.frozenPosition =
          columnFromStorage.frozenPosition;
        matchedColumns.push(columnToMatch);
      }
    });

    return Array.from(new Set(matchedColumns.concat(columns)));
  }

  private setColumnsConfigurationToStorage(
    key: string | undefined,
    columns: ImperiaTableColumn<TItem>[]
  ): void {
    if (!key) return;
    const columnsSaved = columns
      .filter((col) => col.configurable)
      .map(({ configuration }) => ({
        field: configuration.field,
        frozen: configuration.frozen,
        frozenPosition: configuration.frozenPosition,
        visible: configuration.visible,
      }));
    localStorage.setItem(
      key + '_columnsConfiguration',
      JSON.stringify(columnsSaved)
    );
  }

  private getColumnsConfigurationFromStorage(
    storageKey: string | undefined
  ): ColumnConfiguration[] {
    try {
      if (!storageKey) return [];
      const columns = localStorage.getItem(
        storageKey + '_columnsConfiguration'
      );
      if (!columns) return [];
      return JSON.parse(columns);
    } catch (error) {
      localStorage.removeItem(storageKey + '_columnsConfiguration');
      return [];
    }
  }

  private swapColumns(
    columns: ImperiaTableColumn<TItem>[],
    indexA: number,
    indexB: number
  ): ImperiaTableColumn<TItem>[] {
    const columnA = columns[indexA];
    columns[indexA] = columns[indexB];
    columns[indexB] = columnA;
    return columns;
  }

  private allColumns$() {
    return (source: Observable<any>) =>
      source.pipe(
        withLatestFrom(
          defer(() => this.frozenLeftColumns$),
          defer(() => this.nonFrozenColumns$),
          defer(() => this.frozenRightColumns$),
          defer(() => this.hiddenColumns$)
        )
      );
  }

  private canBeSwapped(
    currentColIndex: number,
    targetColIndex: number,
    columns: ImperiaTableColumn<TItem>[]
  ) {
    const columnToSwap = columns[targetColIndex];
    const currentColumn = columns[currentColIndex];

    // if target is ahead of current column and current column is the first one, return false
    if (targetColIndex < currentColIndex && currentColIndex === 0) return false;
    // if target is behind current column and current column is the last one, return false
    if (
      targetColIndex > currentColIndex &&
      currentColIndex === columns.length - 1
    )
      return false;

    // if target column is not configurable, return false
    if (currentColumn.configurable === false) return false;
    // if target column is not configurable, return false
    if (columnToSwap.configurable === false) return false;
    // if target column is not in the same frozen position, return false
    if (
      columnToSwap.configuration.frozenPosition !==
      currentColumn.configuration.frozenPosition
    )
      return false;

    return true;
  }

  private canBeDropped(
    currentArray: ImperiaTableColumn<TItem>[],
    targetArray: ImperiaTableColumn<TItem>[],
    currentIndex: number,
    targetIndex: number
  ) {
    const currentColumn = currentArray[currentIndex];
    //note: the column section can be empty
    const targetColumn = targetArray[targetIndex] ?? null;
    // if target column is not configurable, return false
    if (currentColumn.configurable === false) return false;
    // if target column is not configurable, return false
    if (targetColumn && targetColumn.configurable === false) return false;
    return true;
  }

  private applyStorageConfiguration() {
    return (
      source: Observable<
        ImperiaTableColumn<TItem, TImperiaTableColumnDataInfoTypes>[]
      >
    ) =>
      source.pipe(
        withLatestFrom(this.imperiaTable.storageKey),
        map(([columns, storageKey]) => ({
          columns,
          columnsFromStorage:
            this.getColumnsConfigurationFromStorage(storageKey) ?? [],
        })),
        map(({ columns, columnsFromStorage }) => ({
          columns: columnsFromStorage.length
            ? this.applyColumnsConfiguration(columns, columnsFromStorage)
            : columns,
        })),
        map(({ columns }) => columns)
      );
  }

  private applyDefaultConfig() {
    return (
      source: Observable<
        ImperiaTableColumn<TItem, TImperiaTableColumnDataInfoTypes>[]
      >
    ) =>
      source.pipe(
        withLatestFrom(this.defaultColumnsConfiguration$),
        map(([columns, defaultColumns]) => {
          return columns.map((col) => {
            const defaultCol = defaultColumns.find(
              (defaultCol) => defaultCol.$column() === col.field
            );
            defaultCol &&
              col.configurable &&
              Object.assign(col.configuration, defaultCol.$configuration());
            return col;
          });
        })
      );
  }
  //#endregion HELPERS
}
