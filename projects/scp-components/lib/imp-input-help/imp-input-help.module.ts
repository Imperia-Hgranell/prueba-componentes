import { OverlayModule } from '@angular/cdk/overlay';
import { CdkScrollableModule, ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SkeletonModule } from 'primeng/skeleton';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';
import { ImpInputHelpComponent } from './components/imp-input-help/imp-input-help.component';
import {
  IsContentOverflowingDirective,
  NoMouseWheelDirective,
  TooltipOnHoverDirective,
} from '@imperiascm/scp-components/directives';
import { ImpTooltipDirective } from '../directives/imp-tooltip.directive';

@NgModule({
  declarations: [ImpInputHelpComponent],
  imports: [
    CommonModule,
    OverlayModule,
    CdkScrollableModule,
    ImperiaIconButtonComponent,
    ScrollingModule,
    FormsModule,
    IsContentOverflowingDirective,
    TooltipOnHoverDirective,
    NoMouseWheelDirective,
    ImpTooltipDirective,
    SkeletonModule,
  ],
  exports: [ImpInputHelpComponent],
})
export class ImpInputHelpModule {}
