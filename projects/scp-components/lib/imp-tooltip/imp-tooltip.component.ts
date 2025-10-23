import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  Input,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  ImpResizeEvent,
  ImpResizeEventsDirective,
} from '@imperiascm/dom-utils';
import { withValueFrom } from '@imperiascm/rxjs-utils';
import { FADEIN_FADEOUT } from '@imperiascm/scp-utils/animations';
import { TemplateContext } from '@imperiascm/scp-components/imp-overlay';
import {
  combineLatest,
  filter,
  map,
  ReplaySubject,
  shareReplay,
  Subject,
} from 'rxjs';

@Component({
  templateUrl: './imp-tooltip.component.html',
  styleUrls: ['./imp-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ImpResizeEventsDirective],
  animations: [FADEIN_FADEOUT],
})
export class ImpTooltipComponent {
  @ViewChild('content')
  content!: ElementRef<HTMLElement>;

  @Input('text') set textSetter(v: string) {
    this.text.next(v);
  }
  public text = new ReplaySubject<string>(1);
  @Input('top') set topSetter(v: number) {
    this.top.next(v);
  }
  public top = new ReplaySubject<number>(1);
  @Input('left') set leftSetter(v: number) {
    this.left.next(v);
  }
  public left = new ReplaySubject<number>(1);
  @Input('bottom') set bottomSetter(v: number) {
    this.bottom.next(v);
  }
  public bottom = new ReplaySubject<number>(1);
  @Input('right') set rightSetter(v: number) {
    this.right.next(v);
  }
  public right = new ReplaySubject<number>(1);

  @Input('parentElement') set parentElementSetter(v: HTMLElement | null) {
    if (!v) return;
    this.parentElement.next(v);
  }

  private parentElement = new ReplaySubject<HTMLElement>(1);
  @Input('cellPointerAt') set cellPointerAtSetter(v: string) {
    this.cellPointerAt.next(v);
  }
  public cellPointerAt = new ReplaySubject<string>(1);
  @Input('tooltipTemplate') set tooltipTemplateSetter(
    v: TemplateRef<HTMLElement>
  ) {
    if (!v) return;
    this.tooltipTemplate.next(v);
  }
  public tooltipTemplate = new ReplaySubject<TemplateRef<HTMLElement>>(1);

  @Input('tooltipTemplateContext') set tooltipTemplateContextSetter(
    v: TemplateContext<any>
  ) {
    if (!v) return;
    this.tooltipTemplateContext.next(v);
  }

  public $withCaret = input<boolean>(true, { alias: 'withCaret' });
  public tooltipTemplateContext = new ReplaySubject<TemplateContext<any>>(1);

  //#region BOUNDS
  private inset$ = combineLatest([
    this.top,
    this.right,
    this.bottom,
    this.left,
  ]).pipe(
    map(([top, right, bottom, left]) => ({
      top,
      right,
      bottom,
      left,
      adjusted: false,
    })),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public onSizeChange = new Subject<ImpResizeEvent>();

  private parentElementWidthBounds$ = this.parentElement.pipe(
    map((parentElement) => parentElement.getBoundingClientRect())
  );

  public bounds$ = this.onSizeChange.pipe(
    filter(({ DOMRect }) => DOMRect.width > 20 && DOMRect.height > 10),
    withValueFrom(
      this.inset$,
      this.cellPointerAt,
      this.parentElementWidthBounds$
    ),
    map(
      ([
        {
          DOMRect: { width, height },
        },
        { top, right, bottom, left },
        closestToCenter,
        parentElementBounds,
      ]) => ({
        top,
        right,
        bottom,
        left,
        closestToCenter,
        parentElementBounds,
        width:
          parentElementBounds.width > width
            ? parentElementBounds.width -
              (parentElementBounds.width - width) / 2
            : width - (width - parentElementBounds.width) / 2,
        height:
          parentElementBounds.height > height
            ? parentElementBounds.height
            : height,
      })
    ),
    map(
      ({
        top,
        right,
        bottom,
        left,
        closestToCenter,
        height,
        width,
        parentElementBounds,
      }) => ({
        defaultBounds: { top, right, bottom, left },
        adjustedBounds: {
          top: this.adjustPosition('top', top, closestToCenter, width, height),
          right: this.adjustPosition(
            'right',
            right,
            closestToCenter,
            width,
            height
          ),
          bottom: this.adjustPosition(
            'bottom',
            bottom,
            closestToCenter,
            width,
            height
          ),
          left: this.adjustPosition(
            'left',
            left,
            closestToCenter,
            width,
            height
          ),
        },

        adjusted: true,
        closestToCenter,
        parentElementBounds,
      })
    ),
    map(
      ({
        adjustedBounds,
        defaultBounds,
        adjusted,
        closestToCenter,
        parentElementBounds,
      }) => {
        const isContentOverflowing = this.isContentOverflowing({
          ...adjustedBounds,
        });
        if (isContentOverflowing) {
          return {
            ...this.getDefaultBounds(
              defaultBounds,
              closestToCenter,
              parentElementBounds.width
            ),
            adjusted,
            isContentOverflowing,
          };
        }
        return { ...adjustedBounds, adjusted, isContentOverflowing };
      }
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion BOUNDS

  public showTooltip$ = this.bounds$.pipe(
    map(({ adjusted }) => adjusted),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private getDefaultBounds(
    bounds: {
      top: number | null;
      right: number | null;
      bottom: number | null;
      left: number | null;
    },
    closestToCenter: string,
    parentElementWidth: number
  ) {
    const { top, right, bottom, left } = bounds;
    const atTop = closestToCenter.includes('top');
    const atRight = closestToCenter.includes('right');

    return {
      top: atTop ? null : top !== null ? top : null,
      left: atRight && left !== null ? left - parentElementWidth : null,
      bottom: atTop && bottom !== null ? bottom : null,
      right: atRight
        ? null
        : right !== null
        ? right - parentElementWidth
        : null,
    };
  }

  private isContentOverflowing(bounds: {
    top: number | null;
    right: number | null;
    bottom: number | null;
    left: number | null;
  }): boolean {
    const { clientHeight } = document.documentElement;

    const isOverflowingTop = bounds.top === null ? false : bounds.top < 0;
    const isOverflowingLeft = bounds.left === null ? false : bounds.left < 0;
    const isOverflowingBottom =
      bounds.bottom === null ? false : bounds.bottom > clientHeight;
    const isOverflowingRight = bounds.right === null ? false : bounds.right < 0;

    return (
      isOverflowingTop ||
      isOverflowingLeft ||
      isOverflowingBottom ||
      isOverflowingRight
    );
  }

  private adjustPosition(
    positionName: 'top' | 'left' | 'bottom' | 'right',
    positionValue: number,
    closestToCenter: string,
    width: number,
    height: number
  ) {
    if (positionValue === null) return null;
    if (
      positionName === 'top' &&
      (closestToCenter === 'left-center' || closestToCenter === 'right-center')
    ) {
      return positionValue - height / 2;
    }

    if (positionName === 'right' && closestToCenter === 'left-center') {
      return positionValue + 5;
    }
    if (positionName === 'right' && !(closestToCenter === 'left-center')) {
      return closestToCenter.includes('center')
        ? positionValue - width / 2
        : positionValue - width;
    }

    if (positionName === 'left' && closestToCenter === 'right-center') {
      return positionValue + 5;
    }

    if (positionName === 'left' && !(closestToCenter === 'right-center')) {
      return closestToCenter.includes('center')
        ? positionValue - width / 2
        : positionValue - width;
    }

    return positionValue;
  }
}
