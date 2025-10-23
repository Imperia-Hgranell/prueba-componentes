import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  Renderer2,
} from '@angular/core';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { fieldToImperiaTableColumnClass } from '../pipes/field-to-selectable-class.pipe';
import {
  ReplaySubject,
  animationFrameScheduler,
  buffer,
  bufferCount,
  combineLatestWith,
  debounceTime,
  filter,
  first,
  firstValueFrom,
  fromEvent,
  map,
  race,
  repeat,
  share,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

@Directive({
  selector: '[resizableV2]',
  standalone: true,
})
export class ResizableColumnV2Directive<TItem extends object>
  implements OnDestroy
{
  //#region INPUTS
  @Input('resizableV2') set resizableSetter(v: boolean) {
    this.resizable.next(v);
  }
  private resizable = new ReplaySubject<boolean>(1);
  @Input('resizableColumn') set columnSetter(v: ImperiaTableColumn<TItem>) {
    this.column.next(v);
  }
  private column = new ReplaySubject<ImperiaTableColumn<TItem>>(1);
  //#endregion INPUTS

  //#region COLUMNS - RESIZER - RESIZING INDICATOR
  private columnWithResizerAndIndicator$ = this.resizable.pipe(
    filter((resizable) => resizable),
    combineLatestWith(this.column),
    map(([resizable, column]) => ({
      column,
      resizer: this.createResizer(column.frozenPosition),
    })),
    tap(({ resizer }) =>
      this.renderer.appendChild(this.el.nativeElement, resizer),
    ),
    //finalize(() => console.log('columnWithResizerAndIndicator$ complete')),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  //#endregion COLUMNS - RESIZER - RESIZING INDICATOR

  //#region ON RESIZER PREVENT CONTEXT MENU
  private onResizerIgnoreContextMenu$ = this.columnWithResizerAndIndicator$
    .pipe(
      switchMap(({ resizer }) =>
        fromEvent<MouseEvent>(resizer, 'contextmenu').pipe(
          tap((event) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          }),
        ),
      ),
      //finalize(() => console.log('onResizerIgnoreContextMenu$ complete'))
    )
    .subscribe();
  //#endregion ON RESIZER PREVENT CONTEXT MENU

  //#region ON RESIZE BY DRAGGING
  private onResizerMouseDown$ = this.columnWithResizerAndIndicator$.pipe(
    switchMap(({ resizer, column }) =>
      fromEvent<MouseEvent>(resizer, 'mousedown').pipe(
        tap(() => {
          this.renderer.addClass(this.el.nativeElement, 'resizing');
          this.renderer.setStyle(document.body, 'cursor', 'col-resize');
        }),
        map((mousedown) => ({
          column,
          mousedown,
          startWidth: this.el.nativeElement.clientWidth,
        })),
      ),
    ),
    //finalize(() => console.log('onResizerMouseDown$ complete'))
  );
  private onDocumentMouseUp$ = fromEvent(document.body, 'mouseup').pipe(
    tap(() => {
      this.renderer.removeClass(this.el.nativeElement, 'resizing');
      this.renderer.setStyle(document.body, 'cursor', 'default');
    }),
    //finalize(() => console.log('onDocumentMouseUp$ complete'))
  );
  private resizeByDragging$ = this.onResizerMouseDown$
    .pipe(
      switchMap(({ startWidth, mousedown, column }) =>
        fromEvent<MouseEvent>(document.body, 'mousemove').pipe(
          tap((mousemove) => {
            const newWidth =
              startWidth +
              (mousemove.pageX - mousedown.pageX) *
                (column.frozenPosition == 'right' ? -1 : 1);

            const minWidth =
              column._minWidth == 0 || column.minWidthUnit == '%'
                ? 0
                : column._minWidth;
            const maxWidth =
              column._maxWidth == 'none' || column.maxWidthUnit == '%'
                ? newWidth
                : column._maxWidth;

            if (newWidth < minWidth) return;
            if (newWidth > maxWidth) return;

            if (column.widthUnit == '%' && column.width != 'auto') {
              const percentagePerPixel =
                column.width / this.el.nativeElement.clientWidth;
              // Number.EPSILON is used to avoid rounding errors
              column.width =
                Math.round(
                  (percentagePerPixel * newWidth + Number.EPSILON) * 100,
                ) / 100;
            } else {
              column.width =
                Math.round((newWidth + Number.EPSILON) * 100) / 100;
            }
            column.hasBeenResized = true;
            this.onResize.emit(column);
          }),
          takeUntil(this.onDocumentMouseUp$),
          //finalize(() => console.log('onDocumentMouseMove$ complete'))
        ),
      ),
      //finalize(() => console.log('resizeByDragging$ complete'))
    )
    .subscribe();
  //#endregion ON RESIZE BY DRAGGING

  //#region ON RESIZE BY DOUBLE CLICK ON RESIZER
  private onResizerClick$ = this.columnWithResizerAndIndicator$.pipe(
    switchMap(({ resizer, column }) =>
      fromEvent(resizer, 'click').pipe(
        tap((event) => event.stopPropagation()),
        map(() => column),
      ),
    ),
    //finalize(() => console.log('onResizerClick$ complete')),
    share(),
  );
  private onResizerSingleClick$ = this.onResizerClick$.pipe(
    debounceTime(250),
    //finalize(() => console.log('onResizerSingleClick$ complete'))
  );
  private onResizerDoubleClick$ = this.onResizerClick$.pipe(
    bufferCount(2),
    //finalize(() => console.log('onResizerDoubleClick$ complete'))
  );
  private onResizerClicks$ = race(
    this.onResizerSingleClick$,
    this.onResizerDoubleClick$,
  ).pipe(
    first(),
    repeat(),
    //finalize(() => console.log('onResizerClicks$ complete'))
  );

  private resizeByDoubleClick$ = this.onResizerClick$
    .pipe(
      buffer(this.onResizerClicks$),
      filter((clicks) => clicks.length > 1),
      map((clicks) => clicks[0]),
      tap((column) => this.adjustToContent(column)),
      //finalize(() => console.log('resizeByDoubleClick$ complete'))
    )
    .subscribe();
  //#endregion ON RESIZE BY DOUBLE CLICK ON RESIZER

  @Output() onResize = new EventEmitter<ImperiaTableColumn<TItem>>();

  constructor(
    private el: ElementRef<HTMLTableCellElement>,
    private renderer: Renderer2,
  ) {}

  ngOnDestroy(): void {
    this.onResizerIgnoreContextMenu$.unsubscribe();
    this.resizeByDragging$.unsubscribe();
    this.resizeByDoubleClick$.unsubscribe();
    //this.onDestroy$.next();
    //this.onDestroy$.complete();
  }

  public async adjustToContent(
    column?: ImperiaTableColumn<TItem>,
  ): Promise<boolean> {
    const columnToAdjust =
      column ??
      (await firstValueFrom(
        this.columnWithResizerAndIndicator$.pipe(map(({ column }) => column)),
      ));
    if (!columnToAdjust.resizable) return false;
    let newWidth = 0;
    const { parentElement: row } = this.el.nativeElement;
    const { parentElement: thead } = row ?? {};
    const { parentElement: table } = thead ?? {};
    if (!table) return false;
    this.renderer.addClass(table, 'adjustingColumn');
    const spans = table.querySelectorAll(
      `.${fieldToImperiaTableColumnClass(columnToAdjust.field)} span`,
    );
    const headerSpan = spans[0];
    if (headerSpan) {
      this.renderer.setStyle(spans[0], 'white-space', 'nowrap');
      this.renderer.setStyle(spans[0], 'width', 'auto');
    }

    const isHTMLElement = (span: Element): span is HTMLElement =>
      span instanceof HTMLElement;
    spans.forEach((span, index) => {
      if (index == 0 && columnToAdjust.skipHeaderOnAdjust) return;
      if (!isHTMLElement(span)) return;
      newWidth = Math.max(newWidth, span.offsetWidth + 30);
    });

    if (headerSpan) {
      this.renderer.setStyle(spans[0], 'white-space', 'unset');
      this.renderer.setStyle(spans[0], 'width', '100%');
    }

    if (newWidth == 0) return false;

    const minWidth =
      columnToAdjust._minWidth == 0 || columnToAdjust.minWidthUnit == '%'
        ? 0
        : columnToAdjust._minWidth;
    const maxWidth =
      columnToAdjust._maxWidth == 'none' || columnToAdjust.maxWidthUnit == '%'
        ? newWidth
        : columnToAdjust._maxWidth;

    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;

    if (columnToAdjust.widthUnit == '%' && columnToAdjust.width != 'auto') {
      const percentagePerPixel =
        columnToAdjust.width / this.el.nativeElement.clientWidth;
      // Number.EPSILON is used to avoid rounding errors
      columnToAdjust.width =
        Math.round((percentagePerPixel * newWidth + Number.EPSILON) * 100) /
        100;
    } else {
      // Number.EPSILON is used to avoid rounding errors
      columnToAdjust.width =
        Math.round((newWidth + Number.EPSILON) * 100) / 100;
    }

    columnToAdjust.hasBeenResized = true;

    animationFrameScheduler.schedule(() =>
      this.renderer.setStyle(
        this.el.nativeElement,
        'width',
        `${columnToAdjust.width}${columnToAdjust.widthUnit}`,
      ),
    );
    animationFrameScheduler.schedule(
      () => table.classList.remove('adjustingColumn'),
      200,
    );
    this.onResize.emit(columnToAdjust);
    return true;
  }

  private createResizer(colPosition: 'left' | 'right'): HTMLDivElement {
    const resizer = this.renderer.createElement('div');
    this.renderer.setStyle(resizer, 'position', 'absolute');
    this.renderer.setStyle(resizer, 'top', 0);
    this.renderer.setStyle(
      resizer,
      colPosition == 'left' ? 'right' : 'left',
      '0',
    );
    this.renderer.setStyle(resizer, 'margin-bottom', '-6px');
    this.renderer.addClass(resizer, 'resize-holder');
    this.renderer.setStyle(resizer, 'height', '100%');
    this.renderer.setStyle(resizer, 'width', '12px');
    this.renderer.setStyle(resizer, 'cursor', 'col-resize');
    return resizer;
  }
}
