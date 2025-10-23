import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ImpResizeEventsDirective } from '@imperiascm/dom-utils';
import { ImpTranslateModule, ImpTranslatePipe } from '@imperiascm/translate';
import { ImpInputCalendarComponent } from '@imperiascm/scp-components/imp-input-calendar';
import { ImpInputFilterNumberComponent } from '../imp-input-filter-number/imp-input-filter-number.component';
import { ImpLabelComponent } from '../imp-label/imp-label.component';
import { ImpInputHelpV2Component } from '../imp-input-help-v2/components/imp-input-help-v2/imp-input-help-v2.component';
import { ImpMenuV2Module } from '../imp-menu-v2/imp-menu-v2.module';
import { ImpMenuModule } from '../imp-menu/imp-menu.module';
import { ImperiaTableV2ColumnsConfiguratorComponent } from './components/imperia-table-v2-columns-configurator/imperia-table-v2-columns-configurator.component';
import { ImpTooltipDirective } from '../directives/imp-tooltip.directive';
import { ImperiaTableV2RowSelectionComponent } from './components/imperia-table-v2-selection/imperia-table-v2-row-selection/imperia-table-v2-row-selection.component';
import { ImpColumnsGroupTemplateDirective } from './directives/imp-columns-group-template.directive';
import { ImperiaTableV2RowDetailDirective } from './directives/imperia-table-v2-row-detail.directive';
import { ImperiaTableV2VirtualScrollStrategyDirective } from './directives/imperia-table-v2-virtual-scroll-strategy.directive';
import { ImperiaTableBodyCellContextMenuButtonTemplateDirective } from './template-directives/imperia-table-body-cell-context-menu-button-template.directive';
import { ImperiaTableV2BlockerTemplateDirective } from './template-directives/imperia-table-v2-blocker-template.directive';
import { ImperiaTableV2CellSelectionContextMenuButtonTemplateDirective } from './template-directives/imperia-table-v2-cell-selection-context-menu-button-template.directive';
import {
  CapitalizePipe,
  FilterPipe,
  ImpDatePipe,
  StringParsePipe,
} from '@imperiascm/scp-components/pipes';
import { FormatNumberToPipe } from '../../pipes';
import { LocalizedDatePipe } from '../../pipes';
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
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import {
  IsContentOverflowingDirective,
  TooltipOnHoverDirective,
  NoMouseWheelDirective,
  ImpLoadingBlockerDirective,
  ImpLoadingBlockerMsgDirective,
} from '@imperiascm/scp-components/directives';
import { ImpDateRangeFilterSelectorComponent } from '@imperiascm/scp-components/imp-date-range-filter-selector';
import { ImpDialogComponent } from '../imp-dialog/imp-dialog.component';
import { ImpInputFilterDateComponent } from '../imp-input-filter-date/imp-input-filter-date.component';
import { ImpInputHelpModule } from '../imp-input-help/imp-input-help.module';
import { ImpInputNumberComponent } from '../primeng/imp-input-number/imp-input-number.component';
import { ImpInputTextareaComponent } from '../primeng/imp-input-textarea/imp-input-textarea.component';
import { ImpSelectButtonComponent } from '../imp-select-button/imp-select-button.component';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';
import { ImperiaInputTableComponent } from '../imperia-input-table/imperia-input-table.component';
import { ImperiaTableFilterV2Component } from './components/imperia-table-filter-v2/imperia-table-filter-v2.component';
import { ImperiaTableFilterComponent } from './components/imperia-table-filter/imperia-table-filter.component';
import { ImperiaTableV2CellEditionInfoComponent } from './components/imperia-table-v2-cell-edition-info/imperia-table-v2-cell-edition-info.component';
import { ImperiaTableV2CellOverlayPinnedListComponent } from './components/imperia-table-v2-cell-overlay-pinned-list/imperia-table-v2-cell-overlay-pinned-list.component';
import {
  ImperiaTableV2CellOverlayComponent,
  ImperiaTableV2CellOverlayTemplateDirective,
} from './components/imperia-table-v2-cell-overlay/imperia-table-v2-cell-overlay.component';
import {
  ImperiaTableV2CellValueRestorerComponent,
  ImperiaTableV2CellValueRestorerTemplateDirective,
} from './components/imperia-table-v2-cell-value-restorer/imperia-table-v2-cell-value-restorer.component';
import { ImperiaTableV2DeletionComponent } from './components/imperia-table-v2-deletion/imperia-table-v2-deletion.component';
import { ImperiaTableV2CellEditionComponent } from './components/imperia-table-v2-edition/imperia-table-v2-cell-edition.component';
import { ImperiaTableV2PasteComponent } from './components/imperia-table-v2-paste/imperia-table-v2-paste.component';
import { ImperiaTableV2RowsConfiguratorComponent } from './components/imperia-table-v2-rows-configurator/imperia-table-v2-rows-configurator.component';
import {
  ImperiaTableV2CellSelectionComponent,
  ImperiaTableV2CellSelectionTemplateDirective,
} from './components/imperia-table-v2-selection/imperia-table-v2-cell-selection/imperia-table-v2-cell-selection.component';
import { ImperiaTableV2BaseSelectionDirective } from './components/imperia-table-v2-selection/imperia-table-v2-selection.directive';
import { ImperiaTableV2Component } from './components/imperia-table-v2/imperia-table-v2.component';
import { ImperiaTableComponent } from './components/imperia-table/imperia-table.component';
import { BodyCellContextMenuDirective } from './directives/body-cell-context-menu.directive';
import { CellEditTemplateDirective } from './directives/cell-edit-template.directive';
import { EditableCellDirective } from './directives/editable-cell.directive';
import { HeaderCellContextMenuDirective } from './directives/header-cell-context-menu.directive';
import { ImpColumnCellTemplateDirective } from './directives/imp-column-cell-template.directive';
import { ImperiaTableV2ClicksDirective } from './directives/imperia-table-v2-clicks.directive';
import { ImperiaTableV2ColumnDirective } from './directives/imperia-table-v2-column.directive';
import { ImperiaTableV2ReorderDirective } from './directives/imperia-table-v2-reorder.directive';
import { ImperiaTableV2RowTemplateDirective } from './directives/imperia-table-v2-row-template.directive';
import { ResizableColumnV2Directive } from './directives/resizable-column-v2-directive.directive';
import { ResizeColumnDirective } from './directives/resize-column.directive';
import { CellTemplateContextPipe } from './pipes/cell-template-context.pipe';
import { CellTemplatePipe } from './pipes/cell-template.pipe';
import { FieldToImperiaTableColumnClassPipe } from './pipes/field-to-selectable-class.pipe';
import { FindOptionPipe } from './pipes/find-option.pipe';
import { ImperiaTableBodyCellContextMenuTemplateDirective } from './template-directives/imperia-table-body-cell-context-menu-template.directive';
import { ImperiaTableBodyCellTemplateDirective } from './template-directives/imperia-table-body-cell-template.directive';
import { ImperiaTableColumnsGroupTemplateDirective } from './template-directives/imperia-table-columns-group-template.directive';
import { ImperiaTableHeaderCellContextMenuTemplateDirective } from './template-directives/imperia-table-header-cell-context-menu-template.directive';
import { ImperiaTableHeaderCellIconsTemplateDirective } from './template-directives/imperia-table-header-cell-icons-template.directive';
import { ImperiaTableHeaderCellTemplateDirective } from './template-directives/imperia-table-header-cell-template.directive';
import { ImperiaTableV2RowSelectionContextMenuButtonTemplateDirective } from './template-directives/imperia-table-v2-row-selection-context-menu-button-template.directive';
import { ImpProgressBarComponent } from '@imperiascm/scp-components/imp-progress-bar';

const components = [
  ImperiaTableV2Component,
  ImperiaTableFilterV2Component,
  ImperiaTableV2ClicksDirective,
  ImperiaTableV2RowSelectionComponent,
  ImperiaTableV2CellSelectionComponent,
  ImperiaInputTableComponent,
  ImperiaTableV2ColumnsConfiguratorComponent,
  ImperiaTableV2CellEditionComponent,
  ImperiaTableV2DeletionComponent,
  ImperiaTableV2RowsConfiguratorComponent,
  ImperiaTableV2DeletionComponent,
  ImperiaTableV2CellOverlayComponent,
  ImperiaTableV2CellEditionInfoComponent,
  ImperiaTableV2CellValueRestorerComponent,
  ImperiaTableV2CellOverlayPinnedListComponent,
  ImperiaTableComponent,
  ImperiaTableFilterComponent,
  ImperiaTableV2PasteComponent,
];

const directives = [
  ImperiaTableV2BaseSelectionDirective,
  ImperiaTableV2ReorderDirective,
  ImperiaTableV2CellValueRestorerTemplateDirective,
  ImperiaTableV2ClicksDirective,
  ImperiaTableV2BaseSelectionDirective,
  ResizeColumnDirective,
  EditableCellDirective,
];

const templateDirectives = [
  ImperiaTableV2RowSelectionContextMenuButtonTemplateDirective,
  ImperiaTableV2CellSelectionContextMenuButtonTemplateDirective,
  ImperiaTableV2CellOverlayTemplateDirective,
  ImperiaTableV2CellSelectionTemplateDirective,
  ImperiaTableBodyCellContextMenuButtonTemplateDirective,
  ImperiaTableV2RowDetailDirective,
  ImperiaTableV2RowTemplateDirective,
  ImperiaTableV2BlockerTemplateDirective,
  ImpColumnCellTemplateDirective,
  CellEditTemplateDirective,
];

const pipes = [CellTemplatePipe, CellTemplateContextPipe];

@NgModule({
  declarations: [...components, ...directives, ...templateDirectives, ...pipes],
  imports: [
    CommonModule,
    TableModule,
    OverlayPanelModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    RadioButtonModule,
    ConfirmDialogModule,
    DropdownModule,
    CheckboxModule,
    ImpInputCalendarComponent,
    CalendarModule,
    SkeletonModule,
    ButtonModule,
    ProgressSpinnerModule,
    MenubarModule,
    DialogModule,
    FilterPipe,
    LocalizedDatePipe,
    ImpTranslatePipe,
    StringParsePipe,
    ImpDatePipe,
    ImperiaIconButtonComponent,
    InputSwitchModule,
    ImpLabelComponent,
    IsContentOverflowingDirective,
    TooltipOnHoverDirective,
    NoMouseWheelDirective,
    ImpTooltipDirective,
    ImpInputNumberComponent,
    ImpInputTextareaComponent,
    ImpTranslateModule.forChild({ extend: true }),
    CdkTableModule,
    ScrollingModule,
    DragDropModule,
    ImpDialogComponent,
    ImpSelectButtonComponent, // Added to imports
    ImpInputHelpModule,
    ImpInputHelpV2Component,
    A11yModule,
    ImpMenuModule,
    ImpMenuV2Module,
    ImpResizeEventsDirective,
    ImpLoadingBlockerDirective,
    ImpLoadingBlockerMsgDirective,
    ImpProgressBarComponent,
    ImpDateRangeFilterSelectorComponent,
    ImpInputFilterDateComponent,
    ImpInputFilterNumberComponent,
    FieldToImperiaTableColumnClassPipe,
    ImperiaTableV2VirtualScrollStrategyDirective,
    FindOptionPipe,
    ImperiaTableHeaderCellTemplateDirective,
    ImperiaTableBodyCellTemplateDirective,
    HeaderCellContextMenuDirective,
    BodyCellContextMenuDirective,
    ResizableColumnV2Directive,
    ImperiaTableHeaderCellContextMenuTemplateDirective,
    ImperiaTableHeaderCellIconsTemplateDirective,
    ImperiaTableBodyCellContextMenuTemplateDirective,
    ImperiaTableColumnsGroupTemplateDirective,
    ImpColumnsGroupTemplateDirective,
    ImperiaTableV2ColumnDirective,
    FormatNumberToPipe,
    CapitalizePipe,
  ],
  exports: [
    ...components,
    ImperiaTableV2BaseSelectionDirective,
    ImperiaTableV2ReorderDirective,
    ImperiaTableV2ClicksDirective,
    ImperiaTableV2ColumnDirective,
    ImperiaTableV2DeletionComponent,
    ImperiaTableV2RowDetailDirective,
    ImperiaTableV2RowTemplateDirective,
    ImperiaTableBodyCellContextMenuButtonTemplateDirective,
    ImperiaTableV2CellOverlayTemplateDirective,
    ImperiaTableV2CellSelectionTemplateDirective,
    ImperiaTableV2CellValueRestorerTemplateDirective,
    ImperiaTableV2BlockerTemplateDirective,
    ImpColumnCellTemplateDirective,
    ImpColumnsGroupTemplateDirective,
    ImperiaTableHeaderCellTemplateDirective,
    ImperiaTableBodyCellTemplateDirective,
  ],
  providers: [LocalizedDatePipe, ImperiaTableV2ColumnDirective],
})
export class ImperiaTableModule {}
