import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ImperiaTableV3ManualPaginationComponent } from './components/imperia-table-v3-manual-pagination/imperia-table-v3-manual-pagination.component';
import { ImperiaTableV3PaginationComponent } from './components/imperia-table-v3-pagination/imperia-table-v3-pagination.component';
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
    ImperiaTableV3PaginationComponent,
    ImperiaTableV3ManualPaginationComponent,
  ],
  imports: [
    CommonModule,
    FindPropertyPipe,
    FilterPipe,
    LocalizedDatePipe,
    ImpTranslatePipe,
    StringParsePipe,
    ImpDatePipe,
  ],
  exports: [
    ImperiaTableV3PaginationComponent,
    ImperiaTableV3ManualPaginationComponent,
  ],
})
export class ImperiaTableV3PaginationModule {}
