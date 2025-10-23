import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MenubarModule } from 'primeng/menubar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SidebarModule } from 'primeng/sidebar';
import { ImperiaFormComponent } from './components/imperia-form/imperia-form.component';
import { ImperiaFormMenuTemplateDirective } from './directives/imperia-form-menu-template.directive';
import { ImperiaFormTemplateDirective } from './directives/imperia-form-template.directive';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';

@NgModule({
  declarations: [
    ImperiaFormComponent,
    ImperiaFormTemplateDirective,
    ImperiaFormMenuTemplateDirective,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ImperiaIconButtonComponent,
    SidebarModule,
    MenubarModule,
    ProgressSpinnerModule,
    ScrollingModule,
  ],
  exports: [
    ImperiaFormComponent,
    ImperiaFormTemplateDirective,
    ImperiaFormMenuTemplateDirective,
  ],
})
export class ImperiaFormModule {}
