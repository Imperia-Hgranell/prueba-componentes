import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ImpMenuV2ItemGroupDirective } from './directives/imp-menu-v2-item-group.directive';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';
import { ImpMenuV2Component } from './components/imp-menu-v2/imp-menu-v2.component';
import { ImpMenuV2ItemDirective } from './directives/imp-menu-v2-item.directive';
import { ImpMenuV2GroupTemplateDirective } from './template-directives/imp-menu-v2-group-template.directive';

@NgModule({
  declarations: [
    ImpMenuV2Component,
    ImpMenuV2ItemDirective,
    ImpMenuV2GroupTemplateDirective,
  ],
  imports: [
    CommonModule,
    ImperiaIconButtonComponent,
    A11yModule,
    ImpMenuV2ItemGroupDirective,
  ],
  exports: [
    ImpMenuV2Component,
    ImpMenuV2ItemGroupDirective,
    ImpMenuV2ItemDirective,
  ],
})
export class ImpMenuV2Module {}
