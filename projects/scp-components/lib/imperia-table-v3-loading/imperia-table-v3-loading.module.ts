import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ImperiaTableV3LoadingComponent } from './components/imperia-table-v3-loading/imperia-table-v3-loading.component';
import { ImperiaTableV3LoadingTemplateDirective } from './template-directives/imperia-table-v3-loading-template.directive';
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
    ImperiaTableV3LoadingComponent,
    ImperiaTableV3LoadingTemplateDirective,
  ],
  imports: [
    CommonModule,
    FilterPipe,
    LocalizedDatePipe,
    ImpTranslatePipe,
    StringParsePipe,
    ImpDatePipe,
    FindPropertyPipe,
  ],
  exports: [ImperiaTableV3LoadingComponent],
})
export class ImperiaTableV3LoadingModule {}
