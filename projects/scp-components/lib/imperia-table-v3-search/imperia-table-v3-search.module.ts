import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';
import { ImperiaTableV3SearchComponent } from './components/imperia-table-v3-search/imperia-table-v3-search.component';

@NgModule({
  declarations: [ImperiaTableV3SearchComponent],
  imports: [CommonModule, FormsModule, ImperiaIconButtonComponent],
  exports: [ImperiaTableV3SearchComponent],
})
export class ImperiaTableV3SearchModule {}
