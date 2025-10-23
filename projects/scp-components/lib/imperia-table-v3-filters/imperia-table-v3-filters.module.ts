import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ImperiaTableV3FiltersComponent } from './components/imperia-table-v3-filters/imperia-table-v3-filters.component';
import { ImperiaTableV3FilterDirective } from './directives/imperia-table-v3-filter.directive';
import { ImperiaTableV3FilterStringComponent } from './components/imperia-table-v3-filter-string/imperia-table-v3-filter-string.component';
import { ImperiaTableV3FilterNumberComponent } from './components/imperia-table-v3-filter-number/imperia-table-v3-filter-number.component';
import { ImperiaTableV3FilterDateComponent } from './components/imperia-table-v3-filter-date/imperia-table-v3-filter-date.component';
import { ImperiaTableV3FiltersBodyCellTemplateDirective } from './template-directives/imperia-table-v3-filters-body-cell-template.directive';
import { ImperiaTableV3FiltersHeaderCellTemplateDirective } from './template-directives/imperia-table-v3-filters-header-cell-template.directive';
import {
  ImperiaIconButtonComponent,
  ImpInputFilterDateComponent,
  ImpInputFilterNumberComponent,
  ImpInputHelpV2Component,
  ImpInputNumberComponent,
  ImpLabelComponent,
  IsFilterSelectedPipe,
} from '../public-api';
import {
  AnimatedNumberPipe,
  FilterPipe,
  FindPropertyPipe,
  ImpDatePipe,
  LocalizedDatePipe,
  StringParsePipe,
} from '@imperiascm/scp-components/pipes';
import { ImpTranslatePipe } from '@imperiascm/translate';
import { ImpToggleComponent } from '@imperiascm/scp-components/imp-toggle';
@NgModule({
  declarations: [
    ImperiaTableV3FiltersComponent,
    ImperiaTableV3FilterDirective,
    ImperiaTableV3FilterStringComponent,
    ImperiaTableV3FilterNumberComponent,
    ImperiaTableV3FilterDateComponent,
    ImperiaTableV3FiltersHeaderCellTemplateDirective,
    ImperiaTableV3FiltersBodyCellTemplateDirective,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ImperiaIconButtonComponent,
    FilterPipe,
    LocalizedDatePipe,
    ImpTranslatePipe,
    StringParsePipe,
    ImpDatePipe,
    FindPropertyPipe,
    ImpInputHelpV2Component,
    DropdownModule,
    ImpInputFilterDateComponent,
    ImpInputFilterNumberComponent,
    ImpInputNumberComponent,
    ImpLabelComponent,
    InputSwitchModule,
    AnimatedNumberPipe,
    IsFilterSelectedPipe,
    ImpToggleComponent,
  ],
  exports: [
    ImperiaTableV3FiltersComponent,
    ImperiaTableV3FilterStringComponent,
    ImperiaTableV3FilterNumberComponent,
    ImperiaTableV3FilterDateComponent,
    ImperiaTableV3FilterDirective,
    ImperiaTableV3FiltersHeaderCellTemplateDirective,
    ImperiaTableV3FiltersBodyCellTemplateDirective,
  ],
})
export class ImperiaTableV3FiltersModule {}
