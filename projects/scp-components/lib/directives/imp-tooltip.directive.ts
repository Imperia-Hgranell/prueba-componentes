import {
  ComponentRef,
  Directive,
  ElementRef,
  HostListener,
  Input,
  TemplateRef,
} from '@angular/core';
import { withValueFrom } from '@imperiascm/rxjs-utils';
import { TemplateContext } from '@imperiascm/scp-components/imp-overlay';
import { ImpTooltipComponent } from '../imp-tooltip/imp-tooltip.component';
import { CellCorner } from '@imperiascm/scp-utils/models';
import { ComponentCreator } from '@imperiascm/scp-utils';
import { getHooks } from '@imperiascm/scp-utils/functions';
import {
  debounceTime,
  filter,
  fromEvent,
  map,
  shareReplay,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';

@Directive({
  selector: '[imp-tooltip]',
  standalone: true,
})
export class ImpTooltipDirective {
  @Input('imp-tooltip') tooltipText: string | null = null;
  @Input('impTooltipTemplate')
  tooltipTemplate!: TemplateRef<HTMLElement> | null;
  @Input('impTooltipTemplateContext')
  tooltipTemplateContext!: TemplateContext<any>;
  @Input('withCaret') withCaret: boolean = true;
  @Input('positionRelativeToCursor') positionRelativeToCursor: boolean = false;
  @Input('prioritizePosition') prioritizePosition: 'vertical' | 'horizontal' =
    'vertical';
  private tooltipElementRef!: ComponentRef<ImpTooltipComponent> | undefined;
  private destroy$ = new Subject<void>();

  constructor(
    private elementRef: ElementRef,
    private componentCreator: ComponentCreator
  ) {}

  mouseOverElement$ = fromEvent(
    this.elementRef.nativeElement,
    this.positionRelativeToCursor ? 'mousemove' : 'mouseover'
  )
    .pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.tooltipElementRef && this.hideTooltip();
      }),
      debounceTime(450),
      withValueFrom(fromEvent<MouseEvent>(document, 'mousemove')),
      map(([_, event]) => event),
      map((event) => ({
        canShow: (this.elementRef.nativeElement as HTMLElement).contains(
          document.elementFromPoint(event.clientX, event.clientY) as Node
        ),
        event,
      })),
      filter(({ canShow }) => canShow),
      tap(({ event }) => {
        !this.tooltipElementRef && this.showTooltip(event);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    )
    .subscribe();

  onMouseLeave$ = fromEvent(this.elementRef.nativeElement, 'mouseleave')
    .pipe(
      takeUntil(this.destroy$),
      tap(() => this.tooltipElementRef && this.hideTooltip()),
      shareReplay({ bufferSize: 1, refCount: true })
    )
    .subscribe();

  ngOnDestroy() {
    this.tooltipElementRef && this.hideTooltip();
    this.destroy$.next();
  }

  @HostListener('click') onClick() {
    this.tooltipElementRef && this.hideTooltip();
  }

  private showTooltip(mouseEvent: MouseEvent) {
    setTimeout(() => {
      const toolTipComponentRef =
        this.componentCreator.createComponent(ImpTooltipComponent);
      if (!toolTipComponentRef || this.tooltipText === null) return;
      this.tooltipElementRef = toolTipComponentRef;
      this.tooltipElementRef.setInput(
        'text',
        this.tooltipText
          ? this.tooltipText
          : this.elementRef.nativeElement.innerText
      );
      this.tooltipElementRef.setInput(
        'tooltipTemplateContext',
        this.tooltipTemplateContext
      );
      this.tooltipElementRef.setInput('tooltipTemplate', this.tooltipTemplate);
      this.tooltipElementRef.setInput('withCaret', this.withCaret);

      this.getPosition(
        this.elementRef,
        document.documentElement.getBoundingClientRect(),
        mouseEvent
      );
    });
  }

  private hideTooltip() {
    this.tooltipElementRef?.destroy();
    this.tooltipElementRef = undefined;
  }

  public getPosition(
    parentElement: ElementRef<HTMLElement>,
    bounds: DOMRect,
    mouseEvent: MouseEvent
  ) {
    const closestCornerToBoundsCenter = this.getClosestCornerToBoundsCenter(
      bounds,
      getHooks(parentElement),
      this.prioritizePosition
    );

    const top = closestCornerToBoundsCenter.y - bounds.top;
    const left = closestCornerToBoundsCenter.x - bounds.left;
    const bottom = bounds.bottom - closestCornerToBoundsCenter.y;
    const right = bounds.right - closestCornerToBoundsCenter.x;

    const atTop = closestCornerToBoundsCenter.name.includes('top');
    const atRight = closestCornerToBoundsCenter.name.includes('right');

    const position = {
      top: this.positionRelativeToCursor
        ? mouseEvent.clientY - bounds.top
        : atTop
        ? null
        : top + 5,
      left: this.positionRelativeToCursor
        ? mouseEvent.clientX - bounds.left
        : atRight
        ? left
        : null,
      bottom: this.positionRelativeToCursor
        ? bounds.bottom - mouseEvent.clientY
        : atTop
        ? bottom + 5
        : null,
      right: this.positionRelativeToCursor
        ? bounds.right - mouseEvent.clientX
        : atRight
        ? null
        : right,
      maxHeight: atTop ? bounds.height - bottom : bounds.height - top,
      maxWidth: atRight ? bounds.width - left : bounds.width - right,
      cellPointerAt: closestCornerToBoundsCenter.name,
    };
    if (!this.tooltipElementRef) return;

    this.tooltipElementRef.setInput(
      'parentElement',
      parentElement.nativeElement
    );
    this.tooltipElementRef.setInput('top', position.top);
    this.tooltipElementRef.setInput('left', position.left);
    this.tooltipElementRef.setInput('bottom', position.bottom);
    this.tooltipElementRef.setInput('right', position.right);
    this.tooltipElementRef.setInput('cellPointerAt', position.cellPointerAt);
  }

  private getClosestCornerToBoundsCenter(
    bounds: DOMRect,
    corners: [
      CellCorner<'top-left'>,
      CellCorner<'top-center'>,
      CellCorner<'top-right'>,
      CellCorner<'right-center'>,
      CellCorner<'bottom-right'>,
      CellCorner<'bottom-center'>,
      CellCorner<'left-center'>,
      CellCorner<'bottom-left'>
    ],
    prioritizePosition: 'vertical' | 'horizontal' = 'vertical'
  ) {
    const closestToCenter = corners.reduce<{
      distance: number;
      corner: CellCorner;
    }>(
      (acc, curr) => {
        const distance = Math.sqrt(
          Math.pow(bounds.left + bounds.width / 2 - curr.x, 2) +
            Math.pow(bounds.top + bounds.height / 2 - curr.y, 2)
        );
        return distance < acc.distance ? { distance, corner: curr } : acc;
      },
      { distance: Infinity, corner: corners[0] }
    ).corner;

    if (
      prioritizePosition === 'horizontal' &&
      closestToCenter.name.includes('left')
    ) {
      return (
        corners.find((corner) => corner.name === 'left-center') ??
        closestToCenter
      );
    }

    if (
      prioritizePosition === 'horizontal' &&
      closestToCenter.name.includes('right')
    ) {
      return (
        corners.find((corner) => corner.name === 'right-center') ??
        closestToCenter
      );
    }

    return closestToCenter;
  }
}
