import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import { ImpResizeOriginalAtributte } from './imp-resize-horizontal-content.directive';
import {
  BehaviorSubject,
  filter,
  from,
  fromEvent,
  map,
  Observable,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

@Directive({
  selector: '[impResizeVerticalContent]',
  standalone: true,
})
export class ImpResizeVerticalContentDirective implements OnDestroy {
  //#region INPUTS
  @Input('isVerticalResizableContent') set resizableSetter(v: boolean | null) {
    this.resizable.next(v);
  }
  private resizable = new BehaviorSubject<boolean | null>(false);

  @Input('minHeight') set minHeightSetter(v: string) {
    this.minHeight.next(v);
  }
  private minHeight = new BehaviorSubject<string>('10rem');

  @Input('maxHeight') set maxHeightSetter(v: string) {
    this.maxHeight.next(v);
  }
  private maxHeight = new BehaviorSubject<string>('');

  @Input('resetOriginalValues') resetValues: boolean = false;
  //#endregion INPUTS

  //#region ORIGINAL VALUES
  private ogValues: ImpResizeOriginalAtributte[] = [
    { key: 'width', value: '', cssKey: 'width' },
    { key: 'minWidth', value: '', cssKey: 'min-width' },
    { key: 'maxWidth', value: '', cssKey: 'max-width' },
    { key: 'position', value: '', cssKey: 'position' },
    { key: 'transition', value: '', cssKey: 'transition' },
  ];
  //#endregion ORIGINAL VALUES

  //#region IS DRAGGING
  private isDragging: boolean = false;
  //#endregion IS DRAGGING

  //#region CONTENT RESIZER
  contentResizer$ = this.resizable.pipe(
    switchMap((resizable) =>
      this.removeResizer$().pipe(map(() => [resizable] as const))
    ),
    filter(([resizable]) => resizable ?? false),
    map(([_]) => {
      return this.createResizer();
    }),
    tap((resizer) => {
      this.saveOriginalValues();

      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');

      this.renderer.setStyle(
        this.el.nativeElement,
        'transition',
        'height 0.1s ease-out'
      );
      this.renderer.setStyle(
        this.el.nativeElement,
        'min-height',
        this.minHeight.getValue()
      );
      this.renderer.setStyle(
        this.el.nativeElement,
        'max-height',
        this.maxHeight.getValue()
      );

      this.renderer.appendChild(this.el.nativeElement, resizer);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  //#endregion CONTENT RESIZER

  //#region MOUSE DOWN
  onResizerMouseDown$ = this.contentResizer$.pipe(
    switchMap((resizer) =>
      fromEvent<MouseEvent>(resizer, 'mousedown').pipe(
        tap(() => {
          this.isDragging = true;
          this.renderer.setStyle(document.body, 'cursor', 'ns-resize');
          this.renderer.setStyle(document.body, 'user-select', 'none');
          this.renderer.setStyle(
            resizer,
            'background',
            'rgba(0, 67, 126, 0.1490196078)'
          );
        }),
        map((mousedown) => ({
          mousedown,
          startHeight: this.el.nativeElement.clientHeight,
          startY: mousedown.clientY,
        }))
      )
    )
  );
  //#endregion MOUSE DOWN

  //#region MOUSE UP
  onDocumentMouseUp$ = fromEvent(document.body, 'mouseup').pipe(
    tap(() => {
      this.isDragging = false;
      this.renderer.setStyle(document.body, 'cursor', 'default');
      this.renderer.setStyle(document.body, 'user-select', 'auto');
    })
  );
  //#endregion MOUSE UP

  //#region RESIZE BY DRAGGING
  private resizeByDragging$ = this.onResizerMouseDown$
    .pipe(
      switchMap(({ startHeight, startY }) =>
        fromEvent<MouseEvent>(document.body, 'mousemove').pipe(
          tap((mousemove) => {
            const dy = mousemove.clientY - startY;
            const newHeight = startHeight + dy;
            this.renderer.setStyle(
              this.el.nativeElement,
              'height',
              `${newHeight}px`
            );

            if (newHeight >= this.maxHeight.getValue())
              this.renderer.setStyle(document.body, 'cursor', 's-resize');
            if (newHeight <= this.minHeight.getValue())
              this.renderer.setStyle(document.body, 'cursor', 'n-resize');
          }),
          takeUntil(this.onDocumentMouseUp$)
        )
      )
    )
    .subscribe();
  //#endregion RESIZE BY DRAGGING

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngOnDestroy(): void {
    this.resizeByDragging$.unsubscribe();
  }

  private createResizer(): HTMLDivElement {
    const resizer = this.renderer.createElement('div');
    this.renderer.setStyle(resizer, 'position', 'absolute');
    this.renderer.setStyle(resizer, 'bottom', 0);
    this.renderer.setStyle(resizer, 'left', 0);
    this.renderer.setStyle(resizer, 'width', '100%');
    this.renderer.setStyle(resizer, 'height', '0');
    this.renderer.setStyle(resizer, 'background', 'transparent');
    this.renderer.setStyle(resizer, 'cursor', 'ns-resize');
    this.renderer.setStyle(resizer, 'padding', '4px 0');
    this.renderer.addClass(resizer, 'vertical-resize-holder');

    this.renderer.listen(resizer, 'mouseover', () => {
      if (this.isDragging) return;
      this.renderer.setStyle(
        resizer,
        'background',
        'rgba(0, 67, 126, 0.1490196078)'
      );
    });

    this.renderer.listen(resizer, 'mouseout', () => {
      if (this.isDragging) return;
      this.renderer.setStyle(resizer, 'background', 'transparent');
    });

    this.renderer.listen('body', 'mouseup', () => {
      this.renderer.setStyle(resizer, 'background', 'transparent');
      this.isDragging = false;
    });

    this.renderer.addClass(resizer, 'vertical-resize-holder');
    return resizer;
  }

  private removeResizer$(): Observable<void> {
    return from(
      (async () => {
        const existing = this.el.nativeElement.querySelector(
          '.vertical-resize-holder'
        );

        if (existing) {
          if (this.resetValues)
            this.ogValues.forEach((element) => {
              if (element.value)
                this.renderer.setStyle(
                  this.el.nativeElement,
                  element.cssKey,
                  element.value
                );
            });

          this.renderer.removeStyle(this.el.nativeElement, 'position');
          this.renderer.removeStyle(this.el.nativeElement, 'height');
          this.renderer.removeStyle(this.el.nativeElement, 'min-height');
          this.renderer.removeStyle(this.el.nativeElement, 'transition');
          this.renderer.removeChild(this.el.nativeElement, existing);
        }
      })()
    );
  }

  private saveOriginalValues(): void {
    this.ogValues.map((attribute) => {
      const value = getComputedStyle(this.el.nativeElement)[
        attribute.cssKey as any
      ];
      attribute.value = value;
    });
  }
}
