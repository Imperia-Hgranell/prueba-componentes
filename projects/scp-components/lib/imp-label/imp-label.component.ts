import { CdkMenuModule, CdkMenuTrigger } from '@angular/cdk/menu';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
  NgZone,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';
import { TImperiaTableColumnDataInfoTypes } from '../imperia-table/models/imperia-table-columns.types';
import { TooltipOnHoverDirective } from '@imperiascm/scp-components/directives';
import { ReplaySubject, tap } from 'rxjs';

@Component({
  selector: 'imp-label',
  standalone: true,
  imports: [
    CommonModule,
    TooltipOnHoverDirective,
    ImperiaIconButtonComponent,
    CdkMenuModule,
  ],
  templateUrl: './imp-label.component.html',
  styleUrls: ['./imp-label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpLabelComponent {
  @ViewChild(CdkMenuTrigger) infoContainer!: CdkMenuTrigger;
  @Input() public label: string = '';
  @Input() public labelPosition: 'top' | 'middle' | 'bottom' = 'middle';
  @Input() public labelStyle: Partial<CSSStyleDeclaration> = {};
  @Input() public contentStyle: Partial<CSSStyleDeclaration> = {};
  @Input() public type!: TImperiaTableColumnDataInfoTypes;
  @Input() public required?: boolean = false;
  @Input() public hasInfoDisclaimer?: boolean = false;
  @Input() public infoTitle?: string = '';
  @Input() public infoMessage?: string = '';

  //#region LABEL TEMPLATE
  public labelTemplate$ = new ReplaySubject<TemplateRef<any> | null>(1);
  @ContentChild('labelTemplate') set labelTemplateSetter(
    v: TemplateRef<any> | null
  ) {
    if (!v) return;
    this.labelTemplate$.next(v);
  }
  //#endregion LABEL TEMPLATE

  public onParentScroll$ = this.scrollDispatcher
    .scrolled(100)
    .pipe(tap(() => this.ngZone.run(() => this.infoContainer.close())));

  constructor(
    private scrollDispatcher: ScrollDispatcher,
    private ngZone: NgZone
  ) {}
}
