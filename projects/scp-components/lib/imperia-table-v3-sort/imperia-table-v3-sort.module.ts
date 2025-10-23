import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';
import { ImperiaTableV3SortComponent } from './components/imperia-table-v3-sort/imperia-table-v3-sort.component';
import { ImperiaTableV3SortTemplateDirective } from './template-directives/imperia-table-v3-sort-template.directive';
import {
  FilterPipe,
  FindPropertyPipe,
  ImpDatePipe,
  LocalizedDatePipe,
  StringParsePipe,
} from '@imperiascm/scp-components/pipes';
import { ImpTranslatePipe } from '@imperiascm/translate';

@NgModule({
  declarations: [
    ImperiaTableV3SortComponent,
    ImperiaTableV3SortTemplateDirective,
  ],
  imports: [
    CommonModule,
    ImperiaIconButtonComponent,
    FilterPipe,
    LocalizedDatePipe,
    ImpTranslatePipe,
    StringParsePipe,
    ImpDatePipe,
    FindPropertyPipe,
  ],
  exports: [ImperiaTableV3SortComponent],
})
export class ImperiaTableV3SortModule {}
