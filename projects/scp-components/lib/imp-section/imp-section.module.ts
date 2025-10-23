import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ImpSectionComponent } from './components/imp-section/imp-section.component';
import { ImpSectionItemDirective } from './directives/imp-section-item/imp-section-item.directive';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';

@NgModule({
  declarations: [ImpSectionComponent, ImpSectionItemDirective],
  imports: [CommonModule, ImperiaIconButtonComponent],
  exports: [ImpSectionComponent, ImpSectionItemDirective],
})
export class ImpSectionModule {}
