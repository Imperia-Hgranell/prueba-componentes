import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  FlexibleConnectedPositionStrategy,
  GlobalPositionStrategy,
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  SkipSelf,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { ImperiaFormComponent } from '../imperia-form/components/imperia-form/imperia-form.component';
import {
  Observable,
  ReplaySubject,
  Subject,
  filter,
  from,
  map,
  of,
  startWith,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';
import { ImpTranslateModule, ImpTranslateService } from '@imperiascm/translate';
import { ImpOverlayService } from '@imperiascm/scp-utils/overlay';

@Component({
  selector: 'imp-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ImperiaIconButtonComponent,
    DragDropModule,
    ImpTranslateModule,
    A11yModule,
  ],
  templateUrl: './imp-dialog.component.html',
  styleUrls: ['./imp-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpDialogComponent implements OnChanges, OnDestroy {
  @ViewChild('template', { static: true }) template!: TemplateRef<any>;
  @ViewChild('contentContainer') public content!: ElementRef<HTMLDivElement>;
  public imperiaFormSubject: ReplaySubject<ImperiaFormComponent<any>> =
    new ReplaySubject<ImperiaFormComponent<any>>(1);
  @ContentChild('imperiaFormDialog') set setImperiaFormDialog(
    v: ImperiaFormComponent<any>
  ) {
    this.imperiaFormSubject.next(v);
  }
  @ContentChild('imperiaFormDialog') imperiaForm!: ImperiaFormComponent<any>;

  //#region CONTENTCHILDREN
  @ContentChild('content') contentTemplate!: TemplateRef<any>;
  //#endregion CONTENTCHILDREN

  @Input() autoFocus: boolean = true;
  @Input() hasCheckUnsavedChanges: boolean = false;
  @Input() public relativeToContainer: boolean = false;
  @Input('container') public containerFromInput!: HTMLElement;
  @Input() public visible: boolean = false;
  @Input() public maximized: boolean = false;
  @Input() public maximizable: boolean = true;
  @Input() public closable: boolean = true;
  @Input() public hasBackdrop: boolean = false;
  @Input() public scrollableContent: boolean = true;
  @Input() public closeOnAccept: boolean = true;
  @Input() public acceptLoading: boolean = false;
  @Input() width: string = 'auto';
  @Input() height: string = 'auto';
  @Input() minWidth: string = '300px';
  @Input() minHeight: string = '150px';
  @Input() maxWidth: string = '100%';
  @Input() maxHeight: string = '100%';
  @Input() x: 'center' | 'start' | 'end' = 'center';
  @Input() y: 'center' | 'top' | 'bottom' = 'center';
  @Input() showHeader: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() showFooterButtons: boolean = true;
  @Input() showAcceptButton: boolean = true;
  @Input() showCancelButton: boolean = true;
  @Input() acceptButtonDisabled: boolean = false;
  @Input() cancelButtonDisabled: boolean = false;

  @Output() heightChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() widthChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() maximizedChange: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  @Output() onShow: EventEmitter<void> = new EventEmitter<void>();
  @Output() onAccept: EventEmitter<void> = new EventEmitter<void>();
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onClose: EventEmitter<void> = new EventEmitter<void>();
  @Output() onResizeEnd: EventEmitter<void> = new EventEmitter<void>();
  @Output() onMaximize: EventEmitter<boolean> = new EventEmitter<boolean>();

  private overlayRef: OverlayRef | undefined;
  private lastTransformValue: string = 'none';

  public dragging: boolean = false;

  public resizing: boolean = false;
  public resizeDirection: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  private startX: number = 0;
  private startY: number = 0;
  private lastDeltaX: number = 0;
  private lastDeltaY: number = 0;

  private get container(): Element {
    return this.containerFromInput || this.containerFromDI.nativeElement;
  }

  private get overlayWidth(): string {
    if (!this.relativeToContainer) return this.width;
    const isPercentage = this.width.charAt(this.width.length - 1) === '%';
    if (isPercentage) {
      const width = parseInt(this.width.substring(0, this.width.length - 1));
      if (isNaN(width)) return this.width;
      return (width / 100) * this.container.clientWidth + 'px';
    } else {
      return this.width;
    }
  }

  private get overlayHeight(): string {
    if (!this.relativeToContainer) return this.height;
    const isPercentage = this.height.charAt(this.height.length - 1) === '%';
    if (isPercentage) {
      const height = parseInt(this.height.substring(0, this.height.length - 1));
      if (isNaN(height)) return this.height;
      return (height / 100) * this.container.clientHeight + 'px';
    } else {
      return this.width;
    }
  }

  private get overlayPosition():
    | FlexibleConnectedPositionStrategy
    | GlobalPositionStrategy {
    if (this.relativeToContainer) {
      return this.overlay
        .position()
        .flexibleConnectedTo(this.container)
        .setOrigin(this.container)
        .withFlexibleDimensions(true)
        .withPush(false)
        .withPositions([
          {
            originX: this.x,
            originY: this.y,
            overlayX: this.x,
            overlayY: this.y,
          },
        ]);
    } else {
      const positionGlobal = this.overlay.position().global();
      if (this.x === 'center') {
        positionGlobal.centerHorizontally();
      }
      if (this.x === 'start') {
        positionGlobal.left('2rem');
      }
      if (this.x === 'end') {
        positionGlobal.right('2rem');
      }
      if (this.y === 'center') {
        positionGlobal.centerVertically();
      }
      if (this.y === 'top') {
        positionGlobal.top('2rem');
      }
      if (this.y === 'bottom') {
        positionGlobal.bottom('2rem');
      }
      return positionGlobal;
    }
  }
  constructor(
    private overlay: Overlay,
    private overlayService: ImpOverlayService,
    private viewContainerRef: ViewContainerRef,
    public translate: ImpTranslateService,
    @SkipSelf() private containerFromDI: ElementRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      if (this.visible) {
        this.open();
      } else {
        this.closeDialog.next();
      }
    }
    if (changes['maximized']) {
      this.maximize();
    }
    if (changes['width'] || (changes['height'] && !this.maximized)) {
      this.overlayRef?.updateSize({ width: this.width, height: this.height });
    }
    if (
      changes['minWidth'] ||
      changes['minHeight'] ||
      changes['maxWidth'] ||
      changes['maxHeight']
    ) {
      this.overlayRef?.updateSize({
        minWidth: this.minWidth,
        minHeight: this.minHeight,
        maxWidth: this.maxWidth,
        maxHeight: this.maxHeight,
      });
    }
  }

  ngOnDestroy(): void {
    this.overlayRef?.dispose();
  }

  @HostListener('window:resize')
  public onResize(): void {
    if (this.visible) {
      this.overlayRef?.updatePosition();
    }
  }

  public onDragStarted(): void {
    this.dragging = true;
  }

  public onDragEnded(): void {
    if (!this.overlayRef) return;
    this.dragging = false;
    this.lastTransformValue = this.overlayRef.overlayElement.style.transform;
  }

  public onMouseDown(event: MouseEvent, from: 'right' | 'bottom'): void {
    this.resizing = true;
    this.resizeDirection = from;
    this.startX = event.clientX;
    this.startY = event.clientY;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.resizing) {
      this.lastDeltaY = event.pageY - this.startY;
      this.lastDeltaX = event.pageX - this.startX;
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (!this.overlayRef) return;
    if (!this.resizing) return;
    this.resizing = false;
    if (this.resizeDirection === 'bottom') {
      const newHeight =
        this.overlayRef.overlayElement.clientHeight + this.lastDeltaY * 2;
      this.overlayRef.updateSize({
        height: newHeight,
      });
      this.heightChange.emit(newHeight + 'px');
    } else if (this.resizeDirection == 'right') {
      const newWidth =
        this.overlayRef.overlayElement.clientWidth + this.lastDeltaX * 2;
      this.overlayRef.updateSize({
        width: newWidth,
      });
      this.widthChange.emit(newWidth + 'px');
    }
    setTimeout(() => this.onResizeEnd.emit(), 200);
    this.lastDeltaX = 0;
    this.lastDeltaY = 0;
  }

  public maximize(): void {
    if (!this.overlayRef) return;
    this.maximized = !this.maximized;
    this.maximizedChange.emit(this.maximized);
    this.onMaximize.emit(this.maximized);
    if (this.maximized) {
      this.overlayRef.updateSize({ width: '100vw', height: '100vh' });
      this.overlayRef.overlayElement.style.transform = 'none';
    } else {
      this.overlayRef.updateSize({ width: this.width, height: this.height });
      this.overlayRef.overlayElement.style.transform = this.lastTransformValue;
    }
  }

  public onClickClose(source: 'accept' | 'cancel'): void {
    if ((this.closeOnAccept && source === 'accept') || source === 'cancel') {
      this.visibleChange.emit(false);
      this.closeDialog.next(source);
    }
    if (source === 'accept') {
      this.onAccept.emit();
    } else if (source === 'cancel') {
      this.onCancel.emit();
    }
  }

  private open(): void {
    this.overlayRef = this.overlay.create({
      hasBackdrop: this.hasBackdrop,
      width: this.overlayWidth,
      height: this.overlayHeight,
      minWidth: this.minWidth,
      minHeight: this.minHeight,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight,
      positionStrategy: this.overlayPosition,
    });
    this.overlayRef.attach(
      new TemplatePortal(this.template, this.viewContainerRef)
    );
    this.overlayRef
      .keydownEvents()
      .pipe(
        tap((event) => event.stopImmediatePropagation()),
        filter(() => !this.acceptLoading),
        takeUntil(this.onClose)
      )
      .subscribe((event: KeyboardEvent) => {
        if (event.key === 'Escape') this.onClickClose('cancel');
        if (event.key === 'Enter') this.onClickClose('accept');
      });

    this.onShow.emit();
  }

  public closeDialog: Subject<'accept' | 'cancel' | void> = new Subject<
    'accept' | 'cancel' | void
  >();

  public closeDialog$: Observable<boolean> = this.closeDialog.pipe(
    filter(() => {
      if (this.imperiaForm && this.hasCheckUnsavedChanges) {
        return true;
      } else {
        this.close();
        return false;
      }
    }),
    map(() => {
      const { setDataSyncState, form, item, onSaveEmitter } = this.imperiaForm;
      return {
        setDataSyncState,
        form,
        item,
        onSaveEmitter,
        imperiaForm: this.imperiaForm,
      };
    }),
    withLatestFrom(
      this.imperiaFormSubject.pipe(
        switchMap((form) => (!!form ? form.dataSyncState : 'saved'))
      )
    ),
    switchMap(
      ([{ setDataSyncState, form, item, onSaveEmitter, imperiaForm }, state]) =>
        state == 'unsaved' || state == 'error'
          ? from(
              this.overlayService.saveChanges(
                this.translate.translation.OVERLAYS['save-changes'].message,
                { maxWidth: '30%', minWidth: '30%' }
              )
            ).pipe(
              map((value) => {
                if (value === 2) {
                  onSaveEmitter.emit({
                    setDataSyncState,
                    form,
                    item,
                  });
                  if (!form.valid) {
                    setDataSyncState('update', 'unsaved');
                  }
                  return { close: form.valid, form };
                } else {
                  return { close: !!value, form };
                }
              })
            )
          : form.valid || !form.dirty
          ? of({ close: true, form })
          : of({ close: false, form })
    ),
    tap(({ close, form }) => {
      if (close) {
        this.close();
      }
    }),
    map(() => true),
    startWith(true)
  );

  private close(): void {
    if (!this.overlayRef || !this.overlayRef.hasAttached()) return;
    this.maximized = false;
    this.maximizedChange.emit(this.maximized);
    this.onClose.emit();
    this.overlayRef.detach();
  }
}
