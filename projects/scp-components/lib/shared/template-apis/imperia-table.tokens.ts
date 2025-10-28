import { InjectionToken, TemplateRef } from '@angular/core';
import type { ImperiaTableV2Component } from '../../imperia-table/components/imperia-table-v2/imperia-table-v2.component';
import type { ImperiaTableV2ColumnsConfiguratorComponent } from '../../imperia-table/components/imperia-table-v2-columns-configurator/imperia-table-v2-columns-configurator.component';
import type { ImperiaTableV2RowsConfiguratorComponent } from '../../imperia-table/components/imperia-table-v2-rows-configurator/imperia-table-v2-rows-configurator.component';
import type { ImperiaTableV3Component } from '../../imperia-table-v3/components/imperia-table-v3/imperia-table-v3.component';
import type { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';
import type { ImperiaTableFilterValue } from '../../imperia-table/models/imperia-table-filters.models';
import type { ImperiaTableHeaderCellContextMenuContext } from '../../imperia-table/template-directives/imperia-table-header-cell-context-menu-template.directive';
import { Observable, Subject } from 'rxjs';

export interface ImperiaTableV2Host<TItem extends object>
  extends Pick<
    ImperiaTableV2Component<TItem>,
    | 'blocked$'
    | 'captionMenu$'
    | 'canCloseContextMenu$'
    | 'cellOverlayComponent$'
    | 'cellOverlayVcr'
    | 'cellSelection$'
    | 'click$'
    | 'clicksComponent'
    | 'columns'
    | 'columns$'
    | 'columnsConfigured$'
    | 'columnsFromDirectives$'
    | 'contextMenu$'
    | 'container$'
    | 'dataKeyValue'
    | 'doubleClick$'
    | 'editCellElementIsClicked$'
    | 'editMode$'
    | 'filtersTableContainer$'
    | 'filtersTableContainerHeightChange$'
    | 'filtersTableContainerSizeChange$'
    | 'filtersTableContainerWidthChange$'
    | 'footHeightChange$'
    | 'footerRows$'
    | 'getWidthSum'
    | 'hasCellSelection$'
    | 'hasClickEvents$'
    | 'hasImperiaTableFilterV2$'
    | 'hasRowContextMenuCustomButton$'
    | 'hasRowDetail$'
    | 'hasRowSelection$'
    | 'hasSelection$'
    | 'headHeightChange$'
    | 'isCellSelectedFn$'
    | 'isFocused$'
    | 'isRowSelectedFn$'
    | 'lastCellClicked$'
    | 'lastCellClickedContextMenuVcr'
    | 'loading$'
    | 'mapToRows'
    | 'menuGroupsChanges$'
    | 'onHorizontalScroll$'
    | 'onRowRenderEmitter'
    | 'onRowReorder'
    | 'onScroll'
    | 'onVerticalScroll$'
    | 'orderedColumns$'
    | 'rowSelection$'
    | 'rows$'
    | 'singleClick$'
    | 'storage$'
    | 'storageKey'
    | 'tableSizeChange$'
    | 'toggleFilters'
    | 'value'
    | 'viewport$'
    | 'virtualScrollStrategy'
    | 'scrolling$'
    | 'getCellElementRef'
    | 'colTrackByFn'
    | 'bodyCellContentTemplate'
  > {}

export const IMPERIA_TABLE_V2_HOST = new InjectionToken<
  ImperiaTableV2Host<object>
>('IMPERIA_TABLE_V2_HOST');

export interface ImperiaTableFilterV2<TItem extends object> {
  headerCellFilterIconsTemplate:
    | TemplateRef<ImperiaTableHeaderCellContextMenuContext<TItem>>
    | undefined;
  lastAppliedFilters$: Observable<
    ImperiaTableFilterValue<
      TItem,
      string | ImperiaTableColumn<TItem>
    >[]
  >;
  toggleOpened: Subject<void>;
  addFilter: Subject<ImperiaTableFilterValue<TItem> | string>;
}

export const IMPERIA_TABLE_FILTER_V2 = new InjectionToken<
  ImperiaTableFilterV2<object>
>('IMPERIA_TABLE_FILTER_V2');

export interface ImperiaTableV3Host<TItem extends object>
  extends Pick<
    ImperiaTableV3Component<TItem>,
    | 'canCloseContextMenu$'
    | 'hasImperiaTableV3Filters$'
    | 'hasImperiaTableV3Sort$'
    | 'hasRowContextMenuCustomButton$'
    | 'hasSelection$'
    | 'onHorizontalScroll$'
    | 'onScroll'
  > {}

export const IMPERIA_TABLE_V3_HOST = new InjectionToken<
  ImperiaTableV3Host<object>
>('IMPERIA_TABLE_V3_HOST');

export interface ImperiaTableV2ColumnsConfigurator<TItem extends object>
  extends Pick<
    ImperiaTableV2ColumnsConfiguratorComponent<TItem>,
    | 'applyColumnsConfiguration'
    | 'getColumnsConfigurationFromStorage'
    | 'onColumnsConfigurationChange'
  > {}

export const IMPERIA_TABLE_V2_COLUMNS_CONFIGURATOR = new InjectionToken<
  ImperiaTableV2ColumnsConfigurator<object>
>('IMPERIA_TABLE_V2_COLUMNS_CONFIGURATOR');

export type ImperiaTableV2RowsConfigurator<TItem extends object> =
  ImperiaTableV2RowsConfiguratorComponent<TItem>;

export const IMPERIA_TABLE_V2_ROWS_CONFIGURATOR = new InjectionToken<
  ImperiaTableV2RowsConfigurator<object>
>('IMPERIA_TABLE_V2_ROWS_CONFIGURATOR');
