import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkMenuModule } from '@angular/cdk/menu';
import { CdkScrollableModule, ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTableModule } from '@angular/cdk/table';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ImpResizeEventsDirective } from '@imperiascm/dom-utils';
import {
  ImpLoadingBlockerDirective,
  ImpLoadingBlockerMsgDirective,
  IsContentOverflowingDirective,
  NoMouseWheelDirective,
  TooltipOnHoverDirective,
} from '@imperiascm/scp-components/directives';
import { ImpDateRangeFilterSelectorComponent } from '@imperiascm/scp-components/imp-date-range-filter-selector';
import { ImpInputCalendarComponent } from '@imperiascm/scp-components/imp-input-calendar';
import { ImpProgressBarComponent } from '@imperiascm/scp-components/imp-progress-bar';
import { ImpToggleComponent } from '@imperiascm/scp-components/imp-toggle';
import {
  AnimatedNumberPipe,
  CapitalizePipe,
  ContainsColumnKeyValuePipe,
  EntriesPipe,
  FilterPipe,
  FindPropertyPipe,
  FormatNumberToPipe,
  ImpDatePipe,
  InjectPipe,
  IsDateColFieldPipe,
  StringParsePipe,
} from '@imperiascm/scp-utils/pipes';
import { ImpTranslateModule, ImpTranslatePipe } from '@imperiascm/translate';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SidebarModule } from 'primeng/sidebar';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ImperiaInputTableComponent } from './imperia-input-table/imperia-input-table.component';
import { ImpTooltipDirective } from './directives/imp-tooltip.directive';
import { ImpDialogComponent } from './imp-dialog/imp-dialog.component';
import { ImpInputFilterDateComponent } from './imp-input-filter-date/imp-input-filter-date.component';
import { ImpInputFilterNumberComponent } from './imp-input-filter-number/imp-input-filter-number.component';
import { ImpInputHelpComponent } from './imp-input-help/components/imp-input-help/imp-input-help.component';
import { ImpInputHelpV2Component } from './imp-input-help-v2/components/imp-input-help-v2/imp-input-help-v2.component';
import { ImpInputNumberComponent } from './primeng/imp-input-number/imp-input-number.component';
import { ImpInputTextareaComponent } from './primeng/imp-input-textarea/imp-input-textarea.component';
import { ImpLabelComponent } from './imp-label/imp-label.component';
import { ImpMenuComponent } from './imp-menu/components/imp-menu/imp-menu.component';
import { ImpMenuItemDirective } from './imp-menu/directives/imp-menu-item.directive';
import { ImpMenuV2Component } from './imp-menu-v2/components/imp-menu-v2/imp-menu-v2.component';
import { ImpMenuV2ItemDirective } from './imp-menu-v2/directives/imp-menu-v2-item.directive';
import { ImpMenuV2ItemGroupDirective } from './imp-menu-v2/directives/imp-menu-v2-item-group.directive';
import { ImpMenuV2GroupTemplateDirective } from './imp-menu-v2/template-directives/imp-menu-v2-group-template.directive';
import { ImpSectionComponent } from './imp-section/components/imp-section/imp-section.component';
import { ImpSectionItemDirective } from './imp-section/directives/imp-section-item/imp-section-item.directive';
import { ImpSelectButtonComponent } from './imp-select-button/imp-select-button.component';
import { ImperiaIconButtonComponent } from './imperia-icon-button/imperia-icon-button.component';
import { ImperiaFormComponent } from './imperia-form/components/imperia-form/imperia-form.component';
import { ImperiaFormMenuTemplateDirective } from './imperia-form/directives/imperia-form-menu-template.directive';
import { ImperiaFormTemplateDirective } from './imperia-form/directives/imperia-form-template.directive';
import { ImperiaTableComponent } from './imperia-table/components/imperia-table/imperia-table.component';
import { ImperiaTableFilterComponent } from './imperia-table/components/imperia-table-filter/imperia-table-filter.component';
import { ImperiaTableFilterV2Component } from './imperia-table/components/imperia-table-filter-v2/imperia-table-filter-v2.component';
import { ImperiaTableV2CellEditionComponent } from './imperia-table/components/imperia-table-v2-edition/imperia-table-v2-cell-edition.component';
import { ImperiaTableV2CellEditionInfoComponent } from './imperia-table/components/imperia-table-v2-cell-edition-info/imperia-table-v2-cell-edition-info.component';
import {
  ImperiaTableV2CellOverlayComponent,
  ImperiaTableV2CellOverlayTemplateDirective,
} from './imperia-table/components/imperia-table-v2-cell-overlay/imperia-table-v2-cell-overlay.component';
import { ImperiaTableV2CellOverlayPinnedListComponent } from './imperia-table/components/imperia-table-v2-cell-overlay-pinned-list/imperia-table-v2-cell-overlay-pinned-list.component';
import {
  ImperiaTableV2CellSelectionComponent,
  ImperiaTableV2CellSelectionTemplateDirective,
} from './imperia-table/components/imperia-table-v2-selection/imperia-table-v2-cell-selection/imperia-table-v2-cell-selection.component';
import { ImperiaTableV2RowSelectionComponent } from './imperia-table/components/imperia-table-v2-selection/imperia-table-v2-row-selection/imperia-table-v2-row-selection.component';
import { ImperiaTableV2BaseSelectionDirective } from './imperia-table/components/imperia-table-v2-selection/imperia-table-v2-selection.directive';
import { ImperiaTableV2Component } from './imperia-table/components/imperia-table-v2/imperia-table-v2.component';
import { ImperiaTableV2ColumnsConfiguratorComponent } from './imperia-table/components/imperia-table-v2-columns-configurator/imperia-table-v2-columns-configurator.component';
import { ImperiaTableV2DeletionComponent } from './imperia-table/components/imperia-table-v2-deletion/imperia-table-v2-deletion.component';
import { ImperiaTableV2PasteComponent } from './imperia-table/components/imperia-table-v2-paste/imperia-table-v2-paste.component';
import { ImperiaTableV2RowsConfiguratorComponent } from './imperia-table/components/imperia-table-v2-rows-configurator/imperia-table-v2-rows-configurator.component';
import {
  ImperiaTableV2CellValueRestorerComponent,
  ImperiaTableV2CellValueRestorerTemplateDirective,
} from './imperia-table/components/imperia-table-v2-cell-value-restorer/imperia-table-v2-cell-value-restorer.component';
import { BodyCellContextMenuDirective } from './imperia-table/directives/body-cell-context-menu.directive';
import { CellEditTemplateDirective } from './imperia-table/directives/cell-edit-template.directive';
import { EditableCellDirective } from './imperia-table/directives/editable-cell.directive';
import { HeaderCellContextMenuDirective } from './imperia-table/directives/header-cell-context-menu.directive';
import { ImperiaTableV2ClicksDirective } from './imperia-table/directives/imperia-table-v2-clicks.directive';
import { ImperiaTableV2ColumnDirective } from './imperia-table/directives/imperia-table-v2-column.directive';
import { ImperiaTableV2ReorderDirective } from './imperia-table/directives/imperia-table-v2-reorder.directive';
import { ImperiaTableV2RowDetailDirective } from './imperia-table/directives/imperia-table-v2-row-detail.directive';
import { ImperiaTableV2RowTemplateDirective } from './imperia-table/directives/imperia-table-v2-row-template.directive';
import { ImperiaTableV2VirtualScrollStrategyDirective } from './imperia-table/directives/imperia-table-v2-virtual-scroll-strategy.directive';
import { ImpColumnsGroupTemplateDirective } from './imperia-table/directives/imp-columns-group-template.directive';
import { ResizableColumnV2Directive } from './imperia-table/directives/resizable-column-v2-directive.directive';
import { FindOptionPipe } from './imperia-table/pipes/find-option.pipe';
import { ResizeColumnDirective } from './imperia-table/directives/resize-column.directive';
import { CellTemplateContextPipe } from './imperia-table/pipes/cell-template-context.pipe';
import { CellTemplatePipe } from './imperia-table/pipes/cell-template.pipe';
import { ImperiaTableBodyCellContextMenuButtonTemplateDirective } from './imperia-table/template-directives/imperia-table-body-cell-context-menu-button-template.directive';
import { ImperiaTableBodyCellContextMenuTemplateDirective } from './imperia-table/template-directives/imperia-table-body-cell-context-menu-template.directive';
import { ImperiaTableV2BlockerTemplateDirective } from './imperia-table/template-directives/imperia-table-v2-blocker-template.directive';
import { ImperiaTableV2RowSelectionContextMenuButtonTemplateDirective } from './imperia-table/template-directives/imperia-table-v2-row-selection-context-menu-button-template.directive';
import { ImperiaTableColumnsGroupTemplateDirective } from './imperia-table/template-directives/imperia-table-columns-group-template.directive';
import { ImperiaTableHeaderCellTemplateDirective } from './imperia-table/template-directives/imperia-table-header-cell-template.directive';
import { ImperiaTableBodyCellTemplateDirective } from './imperia-table/template-directives/imperia-table-body-cell-template.directive';
import { ImperiaTableHeaderCellContextMenuTemplateDirective } from './imperia-table/template-directives/imperia-table-header-cell-context-menu-template.directive';
import { ImperiaTableHeaderCellIconsTemplateDirective } from './imperia-table/template-directives/imperia-table-header-cell-icons-template.directive';
import { ImperiaTableV2CellSelectionContextMenuButtonTemplateDirective } from './imperia-table/template-directives/imperia-table-v2-cell-selection-context-menu-button-template.directive';
import { ImperiaTableV3ColumnsGroupsComponent } from './imperia-table-v3/components/imperia-table-v3-columns-groups/imperia-table-v3-columns-groups.component';
import { ImperiaTableV3Component } from './imperia-table-v3/components/imperia-table-v3/imperia-table-v3.component';
import { ImperiaTableV3ColumnsGroupDirective } from './imperia-table-v3/directives/imperia-table-v3-columns-group-directive.directive';
import { ImperiaTableV3FiltersComponent } from './imperia-table-v3-filters/components/imperia-table-v3-filters/imperia-table-v3-filters.component';
import { ImperiaTableV3FilterDirective } from './imperia-table-v3-filters/directives/imperia-table-v3-filter.directive';
import { ImperiaTableV3FilterDateComponent } from './imperia-table-v3-filters/components/imperia-table-v3-filter-date/imperia-table-v3-filter-date.component';
import { ImperiaTableV3FilterNumberComponent } from './imperia-table-v3-filters/components/imperia-table-v3-filter-number/imperia-table-v3-filter-number.component';
import { ImperiaTableV3FilterStringComponent } from './imperia-table-v3-filters/components/imperia-table-v3-filter-string/imperia-table-v3-filter-string.component';
import { ImperiaTableV3FiltersBodyCellTemplateDirective } from './imperia-table-v3-filters/template-directives/imperia-table-v3-filters-body-cell-template.directive';
import { ImperiaTableV3FiltersHeaderCellTemplateDirective } from './imperia-table-v3-filters/template-directives/imperia-table-v3-filters-header-cell-template.directive';
import { IsFilterSelectedPipe } from './imperia-table-v3-filters/pipes/is-filter-selected.pipe';
import { ImperiaTableV3FilterTemplateContextDirective } from './imperia-table-v3-filters/directives/imperia-table-v3-filter-template-context.directive';
import { ImperiaTableV3LoadingComponent } from './imperia-table-v3-loading/components/imperia-table-v3-loading/imperia-table-v3-loading.component';
import { ImperiaTableV3LoadingTemplateDirective } from './imperia-table-v3-loading/template-directives/imperia-table-v3-loading-template.directive';
import { ImperiaTableV3PaginationComponent } from './imperia-table-v3-pagination/components/imperia-table-v3-pagination/imperia-table-v3-pagination.component';
import { ImperiaTableV3ManualPaginationComponent } from './imperia-table-v3-pagination/components/imperia-table-v3-manual-pagination/imperia-table-v3-manual-pagination.component';
import { ImperiaTableV3SearchComponent } from './imperia-table-v3-search/components/imperia-table-v3-search/imperia-table-v3-search.component';
import { ImperiaTableV3SortComponent } from './imperia-table-v3-sort/components/imperia-table-v3-sort/imperia-table-v3-sort.component';
import { ImperiaTableV3SortTemplateDirective } from './imperia-table-v3-sort/template-directives/imperia-table-v3-sort-template.directive';
import { DateAmountColumnsGroupsTemplateContextDirective } from './imperia-table-v3/components/imperia-table-v3-columns-groups/directives/date-amount-columns-groups-template-context.directive';
import { ImperiaTableV3ColumnsConfiguratorComponent } from './imperia-table-v3-columns-configurator/imperia-table-v3-columns-configurator.component';
import { FieldToImperiaTableColumnClassPipe } from './imperia-table/pipes/field-to-selectable-class.pipe';
import { IsColumnPropertiesObjectPipe } from './imperia-table/pipes/is-column-properties-object.pipe';
import { ImpTimeTypeComponent } from './imp-time-type/imp-time-type.component';

const IMPERIA_TABLE_DECLARATIONS = [
  ImperiaTableComponent,
  ImperiaTableFilterComponent,
  ImperiaTableFilterV2Component,
  ImperiaTableV2Component,
  ImperiaTableV2CellEditionComponent,
  ImperiaTableV2CellEditionInfoComponent,
  ImperiaTableV2CellOverlayComponent,
  ImperiaTableV2CellOverlayPinnedListComponent,
  ImperiaTableV2CellSelectionComponent,
  ImperiaTableV2RowSelectionComponent,
  ImperiaTableV2ColumnsConfiguratorComponent,
  ImperiaTableV2DeletionComponent,
  ImperiaTableV2RowsConfiguratorComponent,
  ImperiaTableV2PasteComponent,
  ImperiaTableV2CellValueRestorerComponent,
  ImperiaTableV2BaseSelectionDirective,
  ImperiaTableV2ClicksDirective,
  ImperiaTableV2ReorderDirective,
  ImperiaTableV2RowDetailDirective,
  ImperiaTableV2RowTemplateDirective,
  ImperiaTableV2BlockerTemplateDirective,
  ImperiaTableV2CellSelectionContextMenuButtonTemplateDirective,
  ImperiaTableV2RowSelectionContextMenuButtonTemplateDirective,
  ImperiaTableV2CellSelectionTemplateDirective,
  ImperiaTableV2CellValueRestorerTemplateDirective,
  ImperiaTableV2CellOverlayTemplateDirective,
  ImperiaTableBodyCellContextMenuButtonTemplateDirective,
  CellEditTemplateDirective,
  EditableCellDirective,
  ResizeColumnDirective,
  CellTemplatePipe,
  CellTemplateContextPipe,
];

const IMPERIA_FORM_DECLARATIONS = [
  ImperiaFormComponent,
  ImperiaFormTemplateDirective,
  ImperiaFormMenuTemplateDirective,
];

const IMP_MENU_DECLARATIONS = [ImpMenuComponent, ImpMenuItemDirective];

const IMP_MENU_V2_DECLARATIONS = [
  ImpMenuV2Component,
  ImpMenuV2ItemDirective,
  ImpMenuV2GroupTemplateDirective,
];

const IMP_INPUT_HELP_DECLARATIONS = [ImpInputHelpComponent];

const IMPERIA_TABLE_V3_DECLARATIONS = [
  ImperiaTableV3Component,
  ImperiaTableV3ColumnsGroupsComponent,
  ImperiaTableV3ColumnsGroupDirective,
];

const IMPERIA_TABLE_V3_FILTERS_DECLARATIONS = [
  ImperiaTableV3FiltersComponent,
  ImperiaTableV3FilterDirective,
  ImperiaTableV3FilterStringComponent,
  ImperiaTableV3FilterNumberComponent,
  ImperiaTableV3FilterDateComponent,
  ImperiaTableV3FiltersHeaderCellTemplateDirective,
  ImperiaTableV3FiltersBodyCellTemplateDirective,
];

const IMPERIA_TABLE_V3_SORT_DECLARATIONS = [
  ImperiaTableV3SortComponent,
  ImperiaTableV3SortTemplateDirective,
];

const IMPERIA_TABLE_V3_LOADING_DECLARATIONS = [
  ImperiaTableV3LoadingComponent,
  ImperiaTableV3LoadingTemplateDirective,
];

const IMPERIA_TABLE_V3_PAGINATION_DECLARATIONS = [
  ImperiaTableV3PaginationComponent,
  ImperiaTableV3ManualPaginationComponent,
];

const IMPERIA_TABLE_V3_SEARCH_DECLARATIONS = [ImperiaTableV3SearchComponent];

const DECLARATIONS = [
  ...IMPERIA_TABLE_DECLARATIONS,
  ...IMPERIA_FORM_DECLARATIONS,
  ...IMP_MENU_DECLARATIONS,
  ...IMP_MENU_V2_DECLARATIONS,
  ...IMP_INPUT_HELP_DECLARATIONS,
  ...IMPERIA_TABLE_V3_DECLARATIONS,
  ...IMPERIA_TABLE_V3_FILTERS_DECLARATIONS,
  ...IMPERIA_TABLE_V3_SORT_DECLARATIONS,
  ...IMPERIA_TABLE_V3_LOADING_DECLARATIONS,
  ...IMPERIA_TABLE_V3_PAGINATION_DECLARATIONS,
  ...IMPERIA_TABLE_V3_SEARCH_DECLARATIONS,
];

const STANDALONE_IMPORTS = [
  AnimatedNumberPipe,
  BodyCellContextMenuDirective,
  CapitalizePipe,
  ContainsColumnKeyValuePipe,
  DateAmountColumnsGroupsTemplateContextDirective,
  EntriesPipe,
  FieldToImperiaTableColumnClassPipe,
  FilterPipe,
  FindOptionPipe,
  FindPropertyPipe,
  FormatNumberToPipe,
  InjectPipe,
  StringParsePipe,
  HeaderCellContextMenuDirective,
  ImpColumnsGroupTemplateDirective,
  ImpDatePipe,
  ImpDateRangeFilterSelectorComponent,
  ImpDialogComponent,
  ImpInputCalendarComponent,
  ImpInputFilterDateComponent,
  ImpInputFilterNumberComponent,
  ImpInputHelpV2Component,
  ImpInputNumberComponent,
  ImpInputTextareaComponent,
  ImpLabelComponent,
  ImpLoadingBlockerDirective,
  ImpLoadingBlockerMsgDirective,
  ImpProgressBarComponent,
  ImpResizeEventsDirective,
  ImpSectionComponent,
  ImpSectionItemDirective,
  ImpSelectButtonComponent,
  ImpToggleComponent,
  ImpTooltipDirective,
  ImpTranslatePipe,
  ImperiaIconButtonComponent,
  ImperiaTableBodyCellContextMenuTemplateDirective,
  ImperiaTableBodyCellTemplateDirective,
  ImperiaTableColumnsGroupTemplateDirective,
  ImperiaTableHeaderCellContextMenuTemplateDirective,
  ImperiaTableHeaderCellIconsTemplateDirective,
  ImperiaTableHeaderCellTemplateDirective,
  ImperiaTableV2ColumnDirective,
  ImperiaTableV2VirtualScrollStrategyDirective,
  ImperiaTableV3ColumnsConfiguratorComponent,
  ImperiaTableV3FilterTemplateContextDirective,
  IsContentOverflowingDirective,
  IsDateColFieldPipe,
  IsFilterSelectedPipe,
  NoMouseWheelDirective,
  ResizableColumnV2Directive,
  TooltipOnHoverDirective,
  ImpMenuV2ItemGroupDirective,
  IsColumnPropertiesObjectPipe,
  ImperiaInputTableComponent,
  ImpTimeTypeComponent,
];

const MODULE_IMPORTS = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  CdkTableModule,
  ScrollingModule,
  CdkScrollableModule,
  DragDropModule,
  A11yModule,
  CdkMenuModule,
  OverlayModule,
  TableModule,
  OverlayPanelModule,
  InputTextModule,
  InputNumberModule,
  RadioButtonModule,
  ConfirmDialogModule,
  DropdownModule,
  CheckboxModule,
  CalendarModule,
  SkeletonModule,
  ButtonModule,
  ProgressSpinnerModule,
  MenubarModule,
  DialogModule,
  InputSwitchModule,
  SidebarModule,
  ImpTranslateModule.forChild({ extend: true }),
];

@NgModule({
  declarations: DECLARATIONS,
  imports: [...MODULE_IMPORTS, ...STANDALONE_IMPORTS],
  exports: [...DECLARATIONS, ...STANDALONE_IMPORTS],
  providers: [
    ImperiaTableV2ColumnDirective,
    AnimatedNumberPipe,
    CapitalizePipe,
    ContainsColumnKeyValuePipe,
    EntriesPipe,
    FilterPipe,
    FindPropertyPipe,
    FormatNumberToPipe,
    ImpDatePipe,
    InjectPipe,
    IsDateColFieldPipe,
    StringParsePipe,
  ],
})
export class ScpComponentsModule {}
