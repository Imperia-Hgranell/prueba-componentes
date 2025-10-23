import { CdkMenuModule } from '@angular/cdk/menu';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ImpMenuComponent } from './components/imp-menu/imp-menu.component';
import { ImpMenuItemDirective } from './directives/imp-menu-item.directive';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';

@NgModule({
  declarations: [ImpMenuComponent, ImpMenuItemDirective],
  imports: [CommonModule, CdkMenuModule, ImperiaIconButtonComponent],
  exports: [ImpMenuComponent, ImpMenuItemDirective],
})
export class ImpMenuModule {}
