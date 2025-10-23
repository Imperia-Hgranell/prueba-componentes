import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ImpResizeEventsDirective } from '@imperiascm/dom-utils';
import { BodyCellContextMenuDirective } from '../imperia-table/directives/body-cell-context-menu.directive';
import { DateAmountColumnsGroupsTemplateContextDirective } from './components/imperia-table-v3-columns-groups/directives/date-amount-columns-groups-template-context.directive';
import { FieldToImperiaTableColumnClassPipe } from '../imperia-table/pipes/field-to-selectable-class.pipe';
import { FindOptionPipe } from '../imperia-table/pipes/find-option.pipe';
import { HeaderCellContextMenuDirective } from '../imperia-table/directives/header-cell-context-menu.directive';
import { ImpColumnsGroupTemplateDirective } from '../imperia-table/directives/imp-columns-group-template.directive';
import { ImpMenuV2Module } from '../imp-menu-v2/imp-menu-v2.module';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';
import { ImperiaTableBodyCellContextMenuTemplateDirective } from '../imperia-table/template-directives/imperia-table-body-cell-context-menu-template.directive';
import { ImperiaTableBodyCellTemplateDirective } from '../imperia-table/template-directives/imperia-table-body-cell-template.directive';
import { ImperiaTableColumnsGroupTemplateDirective } from '../imperia-table/template-directives/imperia-table-columns-group-template.directive';
import { ImperiaTableHeaderCellContextMenuTemplateDirective } from '../imperia-table/template-directives/imperia-table-header-cell-context-menu-template.directive';
import { ImperiaTableHeaderCellIconsTemplateDirective } from '../imperia-table/template-directives/imperia-table-header-cell-icons-template.directive';
import { ImperiaTableHeaderCellTemplateDirective } from '../imperia-table/template-directives/imperia-table-header-cell-template.directive';
import { ImperiaTableModule } from '../imperia-table/imperia-table.module';
import { ImperiaTableV2VirtualScrollStrategyDirective } from '../imperia-table/directives/imperia-table-v2-virtual-scroll-strategy.directive';
import { ImperiaTableV3ColumnsGroupDirective } from './directives/imperia-table-v3-columns-group-directive.directive';
import { ResizableColumnV2Directive } from '../imperia-table/directives/resizable-column-v2-directive.directive';
import { ImpProgressBarComponent } from '@imperiascm/scp-components/imp-progress-bar';
import { ImperiaTableV3ColumnsGroupsComponent } from './components/imperia-table-v3-columns-groups/imperia-table-v3-columns-groups.component';
import { ImperiaTableV3Component } from './components/imperia-table-v3/imperia-table-v3.component';
import {
  ImpLoadingBlockerDirective,
  ImpLoadingBlockerMsgDirective,
} from '@imperiascm/scp-components/directives';
import {
  ContainsColumnKeyValuePipe,
  EntriesPipe,
  FilterPipe,
  FindPropertyPipe,
  FormatNumberToPipe,
  ImpDatePipe,
  InjectPipe,
  IsDateColFieldPipe,
  LocalizedDatePipe,
  StringParsePipe,
} from '@imperiascm/scp-components/pipes';
import { ImpTranslatePipe } from '@imperiascm/translate';
import { IsColumnPropertiesObjectPipe } from '../imperia-table/pipes/is-column-properties-object.pipe';

const components = [
  ImperiaTableV3Component,
  ImperiaTableV3ColumnsGroupsComponent,
];

const directives = [ImperiaTableV3ColumnsGroupDirective];

const templateDirectives = [
  ImperiaTableHeaderCellTemplateDirective,
  ImperiaTableBodyCellTemplateDirective,
  ImperiaTableHeaderCellContextMenuTemplateDirective,
  ImperiaTableHeaderCellIconsTemplateDirective,
  ImperiaTableBodyCellContextMenuTemplateDirective,
  ImperiaTableColumnsGroupTemplateDirective,
  DateAmountColumnsGroupsTemplateContextDirective,
  ImpColumnsGroupTemplateDirective,
];

@NgModule({
  declarations: [...components, ...directives],
  imports: [
    CommonModule,
    ImpLoadingBlockerDirective,
    ImpProgressBarComponent,
    FilterPipe,
    LocalizedDatePipe,
    ImpTranslatePipe,
    StringParsePipe,
    ImpDatePipe,
    FindPropertyPipe,
    ImpMenuV2Module,
    ImperiaIconButtonComponent,
    ImpResizeEventsDirective,
    A11yModule,
    DragDropModule,
    ScrollingModule,
    FieldToImperiaTableColumnClassPipe,
    ImperiaTableV2VirtualScrollStrategyDirective,
    FindOptionPipe,
    HeaderCellContextMenuDirective,
    BodyCellContextMenuDirective,
    ResizableColumnV2Directive,
    InjectPipe,
    IsDateColFieldPipe,
    EntriesPipe,
    ContainsColumnKeyValuePipe,
    IsColumnPropertiesObjectPipe,
    ImperiaTableModule,
    FormatNumberToPipe,
    ImpLoadingBlockerMsgDirective,
    ...templateDirectives,
  ],
  exports: [
    ...components,
    ...directives,
    ImpColumnsGroupTemplateDirective,
    ImperiaTableHeaderCellTemplateDirective,
    ImperiaTableBodyCellTemplateDirective,
  ],
})
export class ImperiaTableV3Module {}
