import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  Renderer2,
} from '@angular/core';
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

export interface ImpResizeOriginalAtributte {
  key: string;
  value: string;
  cssKey: string;
}

@Directive({
  selector: '[impResizeHorizontalContent]',
  standalone: true,
})
export class ImpResizeHorizontalContentDirective implements OnDestroy {
  //#region INPUTS
  @Input('isHorizontalResizableContent') set resizableSetter(
    v: boolean | null,
  ) {
    this.resizable.next(v);
  }
  private resizable = new BehaviorSubject<boolean | null>(false);

  @Input('minWidth') set minWidthSetter(v: string) {
    this.minWidth.next(v);
  }
  private minWidth = new BehaviorSubject<string>('');

  @Input('maxWidth') set maxWidthSetter(v: string) {
    this.maxWidth.next(v);
  }
  private maxWidth = new BehaviorSubject<string>('');

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
      this.removeResizer$().pipe(map(() => [resizable] as const)),
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
        'width 0.1s ease-out',
      );
      this.renderer.setStyle(
        this.el.nativeElement,
        'min-width',
        this.minWidth.getValue(),
      );
      this.renderer.setStyle(
        this.el.nativeElement,
        'max-width',
        this.maxWidth.getValue(),
      );

      this.renderer.appendChild(this.el.nativeElement, resizer);
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  //#endregion CONTENT RESIZER

  //#region MOUSE DOWN
  onResizerMouseDown$ = this.contentResizer$.pipe(
    switchMap((resizer) =>
      fromEvent<MouseEvent>(resizer, 'mousedown').pipe(
        tap(() => {
          this.isDragging = true;
          this.renderer.setStyle(document.body, 'cursor', 'ew-resize');
          this.renderer.setStyle(document.body, 'user-select', 'none');
          this.renderer.setStyle(
            resizer,
            'background',
            'rgba(0, 67, 126, 0.1490196078)',
          );
        }),
        map((mousedown) => ({
          mousedown,
          startWidth: this.el.nativeElement.clientWidth,
          startX: mousedown.clientX,
        })),
      ),
    ),
  );
  //#endregion MOUSE DOWN

  //#region MOUSE UP
  onDocumentMouseUp$ = fromEvent(document.body, 'mouseup').pipe(
    tap(() => {
      this.isDragging = false;
      this.renderer.setStyle(document.body, 'cursor', 'default');
      this.renderer.setStyle(document.body, 'user-select', 'auto');
    }),
  );
  //#endregion MOUSE UP

  //#region RESIZE BY DRAGGING
  private resizeByDragging$ = this.onResizerMouseDown$
    .pipe(
      switchMap(({ startWidth, startX }) =>
        fromEvent<MouseEvent>(document.body, 'mousemove').pipe(
          tap((mousemove) => {
            const dx = mousemove.clientX - startX;
            const newWidth = startWidth + dx;
            if (newWidth > 0) {
              this.renderer.setStyle(
                this.el.nativeElement,
                'width',
                `${newWidth}px`,
              );
            }

            if (newWidth >= this.maxWidth.getValue())
              this.renderer.setStyle(document.body, 'cursor', 'w-resize');
            if (newWidth <= this.minWidth.getValue())
              this.renderer.setStyle(document.body, 'cursor', 'e-resize');
          }),
          takeUntil(this.onDocumentMouseUp$),
        ),
      ),
    )
    .subscribe();
  //#endregion RESIZE BY DRAGGING

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
  ) {}

  ngOnDestroy(): void {
    this.resizeByDragging$.unsubscribe();
  }

  private createResizer(): HTMLDivElement {
    const resizer = this.renderer.createElement('div');
    this.renderer.setStyle(resizer, 'position', 'absolute');
    this.renderer.setStyle(resizer, 'top', 0);
    this.renderer.setStyle(resizer, 'right', 0);
    this.renderer.setStyle(resizer, 'height', '100%');
    this.renderer.setStyle(resizer, 'width', '0');
    this.renderer.setStyle(resizer, 'background', 'transparent');
    this.renderer.setStyle(resizer, 'cursor', 'ew-resize');
    this.renderer.setStyle(resizer, 'padding', '0 3px');
    this.renderer.setStyle(resizer, 'transition', 'background-color 200ms');

    this.renderer.listen(resizer, 'mouseover', () => {
      if (this.isDragging) return;
      this.renderer.setStyle(
        resizer,
        'background',
        'rgba(0, 67, 126, 0.1490196078)',
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

    this.renderer.addClass(resizer, 'horizontal-resize-holder');
    return resizer;
  }

  private removeResizer$(): Observable<void> {
    return from(
      (async () => {
        const existing = this.el.nativeElement.querySelector(
          '.horizontal-resize-holder',
        );
        if (existing) {
          if (this.resetValues)
            this.ogValues.forEach((element) => {
              if (element.value)
                this.renderer.setStyle(
                  this.el.nativeElement,
                  element.cssKey,
                  element.value,
                );
            });

          this.renderer.removeChild(this.el.nativeElement, existing);
        }
      })(),
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
