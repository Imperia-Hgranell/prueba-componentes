import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  ElementRef,
  EventEmitter,
  input,
  Input,
  Optional,
  Output,
  SkipSelf,
  TemplateRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';

//Mantener orden alfabético si se añaden más iconos
//Si los metemos primero en la carpeta de assets/icons, hay salen ordenados alfabéticamente
export type ICONS_NAMES =
  | 'a-z'
  | 'amount'
  | 'analytics'
  | 'analytics'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'article'
  | 'article'
  | 'autorenew'
  | 'back-arrow'
  | 'back-field'
  | 'bookmark_filled'
  | 'bookmark-save'
  | 'bookmark-save'
  | 'bookmark'
  | 'calculate'
  | 'calendar-day'
  | 'calendar-month'
  | 'calendar-none'
  | 'calendar-week'
  | 'char-data'
  | 'char-data'
  | 'chat'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'circle-cross-red'
  | 'circle-cross'
  | 'circle-tick'
  | 'circle'
  | 'closed-section'
  | 'columns-adjust'
  | 'columns-configurator'
  | 'configuration'
  | 'connection'
  | 'copy'
  | 'cycle'
  | 'cycle'
  | 'dashboard'
  | 'dashboard'
  | 'divide'
  | 'double-chevron-left'
  | 'double-chevron-right'
  | 'download'
  | 'drag-indicator'
  | 'edit-frozen'
  | 'edit-menu'
  | 'edit-semi-frozen'
  | 'edit-square'
  | 'edit-square'
  | 'end-review'
  | 'exclamation'
  | 'exclamation'
  | 'export-excel'
  | 'eye-off'
  | 'eye'
  | 'filter'
  | 'fix'
  | 'full-bookmark'
  | 'full-filter'
  | 'graph'
  | 'green-warning'
  | 'green-warning'
  | 'hamburguer'
  | 'help'
  | 'history'
  | 'info'
  | 'insert-chart'
  | 'insert-chart'
  | 'join'
  | 'join'
  | 'link'
  | 'list-edit'
  | 'list'
  | 'lock-blocked'
  | 'lock-semi-blocked'
  | 'lock'
  | 'mail'
  | 'menu-left-side'
  | 'menu-right-side'
  | 'menu-toolbar'
  | 'minus'
  | 'money-bag'
  | 'money-bag'
  | 'more-h'
  | 'more-v'
  | 'multi-select-check'
  | 'multiply'
  | 'nav-current-date'
  | 'net-amount'
  | 'no-filter'
  | 'open-section'
  | 'pencil'
  | 'phone'
  | 'play'
  | 'plugin-off'
  | 'plugin-on'
  | 'plus'
  | 'preview'
  | 'quantity'
  | 'question-mark'
  | 'red-exclamation-circle'
  | 'red-exclamation-circle'
  | 'red-warning'
  | 'red-warning'
  | 'round-chevron-left'
  | 'round-chevron-right'
  | 'rows-configurator'
  | 'save'
  | 'schedule'
  | 'search'
  | 'snapshot'
  | 'snapshot'
  | 'square-exclamation'
  | 'square-exclamation'
  | 'trash'
  | 'unfix'
  | 'upload'
  | 'videocall'
  | 'x'
  | 'yellow-warning'
  | 'yellow-warning'
  | 'z-a';

type COMPONENT_TYPES = 'button' | 'icon';

@Component({
  selector: 'imperia-icon-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './imperia-icon-button.component.html',
  styleUrls: ['./imperia-icon-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImperiaIconButtonComponent {
  public $showDefaultTooltip = input<boolean>(true, {
    alias: 'showDefaultTooltip',
  });
  @Input() type: COMPONENT_TYPES = 'icon';
  @Input() icon!: ICONS_NAMES | null;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() containerSize: number = 38;
  @Input() containerClass: string = '';
  @Input() imgSize: number = 16;
  @Input() imgClass: string = '';
  @Input() text: string = '';
  @Input() textPosition: 'left' | 'center' | 'right' = 'center';
  @Input() title: string = '';
  @Input() disabled: boolean | null | undefined = false;
  @Input() active: boolean | null | undefined = false;
  @Input() activeButtonStyle: { [key: string]: string } | null = null;
  @Input() buttonStyle: { [key: string]: string } | null = null;
  @Input('primeNGIconClass') set primeNGIconClassSetter(
    v: string | string[] | null
  ) {
    if (!v) {
      this.primeNGIconClass = [];
    } else if (typeof v === 'string') {
      this.primeNGIconClass = [v];
    } else {
      this.primeNGIconClass = v;
    }
  }
  public primeNGIconClass: string[] = [];
  @Input() linkTo!: string | any[] | null | undefined;
  @Input() loading: boolean | null | undefined = false;
  @Input() shadow: boolean = false;

  //#region TEXT TEMPLATE
  public $textTemplate = contentChild<TemplateRef<any>>('textTemplate');
  //#endregion TEXT TEMPLATE

  @Output('onClick') onClickEvent: EventEmitter<any> = new EventEmitter<any>();

  get hasIcon(): boolean {
    return !!this.icon || !!this.primeNGIconClass.length;
  }

  get containerTitle(): string {
    return this.el?.nativeElement.title ?? '';
  }

  constructor(
    @SkipSelf() @Optional() private el: ElementRef<HTMLElement> | null = null
  ) {}

  onClick(event: any) {
    if (this.disabled || this.loading) return;
    this.onClickEvent.emit(event);
  }
}
