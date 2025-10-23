import { Directive, ElementRef, Input, Output } from '@angular/core';
import {
  ReplaySubject,
  auditTime,
  bufferCount,
  filter,
  fromEvent,
  map,
  merge,
  of,
  pairwise,
  share,
  shareReplay,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs';

@Directive({
  selector: '[impInfiniteScroll]',
  standalone: true,
})
export class InfiniteScrollDirective {
  //#region INPUTS
  private resetPagination = new ReplaySubject<{ Page: number }>(1);
  @Input('resetPagination') set resetPaginationSetter(
    v: { Page: number } | null,
  ) {
    if (!v) return;
    this.resetPagination.next(v);
  }

  private pageSize = new ReplaySubject<number>(1);
  @Input('pageSize') set pageSizeSetter(v: number | null) {
    if (!v) return;
    this.pageSize.next(v);
  }

  private itemsLength = new ReplaySubject<number>(1);
  @Input('itemsLength') set itemsLengthSetter(v: number | null) {
    if (!v) return;
    this.itemsLength.next(v);
  }

  private changingPage = new ReplaySubject<boolean>(1);
  @Input('changingPage') set changingPageSetter(v: boolean | null) {
    if (v === null) return;
    this.changingPage.next(v);
  }
  private changingPage$ = this.changingPage.pipe(
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  //#endregion INPUTS

  //#region VERTICAL SCROLL
  private onVerticalScroll$ = of(
    document.getElementById('scrollable-parent-container') ??
      document.documentElement,
  ).pipe(
    switchMap((container) =>
      fromEvent(container, 'scroll')
        .pipe(
          map(() =>
            this.getVerticalScrollInfo(container, this.el.nativeElement),
          ),
        )
        .pipe(
          startWith({
            scrollTop: null as any,
            scrollHeight: null as any,
            offsetHeight: null as any,
            elementOffsetTop: null as any,
          }),
          pairwise(),
          filter(
            ([prev, curr]) =>
              this.verticalScrollHasChanged([prev, curr]) &&
              this.isScrollingDown([prev, curr]),
          ),
          map(([prev, curr]) => curr),
        ),
    ),
    share(),
  );

  private isScrollAtBottom$ = this.onVerticalScroll$.pipe(
    auditTime(100),
    withLatestFrom(this.itemsLength),
    filter(([_, itemsLength]) => itemsLength > 0),
    map(([scrollInfo]) => scrollInfo),
    filter(this.isScrollAtBottom),
    map(() => true),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private getVerticalScrollInfo(
    parentContainer: HTMLElement,
    htmlElement: HTMLElement,
  ) {
    const windowScrollTop = parentContainer.scrollTop || window.pageYOffset;
    const windowHeight = window.innerHeight;
    const elementScrollHeight = htmlElement.scrollHeight;
    const elementOffsetTop =
      htmlElement.getBoundingClientRect().top + windowScrollTop;

    return {
      scrollTop: windowScrollTop,
      scrollHeight: elementScrollHeight,
      offsetHeight: windowHeight,
      elementOffsetTop: elementOffsetTop,
    };
  }

  private isScrollingDown([prev, curr]: [
    {
      scrollTop: number;
      scrollHeight: number;
      offsetHeight: number;
      elementOffsetTop: number;
    },
    {
      scrollTop: number;
      scrollHeight: number;
      offsetHeight: number;
      elementOffsetTop: number;
    },
  ]): boolean {
    return curr.scrollTop > prev.scrollTop;
  }

  private verticalScrollHasChanged([prev, curr]: [
    {
      scrollTop: number;
      scrollHeight: number;
      offsetHeight: number;
      elementOffsetTop: number;
    },
    {
      scrollTop: number;
      scrollHeight: number;
      offsetHeight: number;
      elementOffsetTop: number;
    },
  ]) {
    return (
      prev.scrollTop !== curr.scrollTop ||
      prev.offsetHeight !== curr.offsetHeight ||
      prev.elementOffsetTop !== curr.elementOffsetTop
    );
  }

  private isScrollAtBottom({
    scrollTop,
    offsetHeight,
    scrollHeight,
    elementOffsetTop,
  }: {
    scrollTop: number;
    offsetHeight: number;
    scrollHeight: number;
    elementOffsetTop: number;
  }): boolean {
    if (scrollTop === 0 || scrollHeight === 0) return false;
    return scrollTop + offsetHeight >= elementOffsetTop + scrollHeight * 0.6;
  }
  //#endregion VERTICAL SCROLL

  constructor(private el: ElementRef) {}

  //#region ON PAGE CHANGES
  @Output('onPageChanges') onPageChanges$ = merge(
    this.resetPagination.pipe(
      withLatestFrom(this.pageSize),
      map(([{ Page }, pageSize]) => ({ Page, Size: pageSize })),
    ),
    this.isScrollAtBottom$.pipe(
      withLatestFrom(this.changingPage$),
      filter(([atBottom, changingPage]) => !changingPage),
      withLatestFrom(
        this.itemsLength.pipe(startWith(0), pairwise()),
        this.pageSize,
      ),
      filter(
        ([_, [lastItemsLength, newItemsLength], pageSize]) =>
          lastItemsLength !== newItemsLength,
      ),
      map(([_, [lastItemsLength, newItemsLength], pageSize]) => ({
        Page: newItemsLength / pageSize + 1,
        Size: pageSize,
      })),
      filter(({ Page }) => Number.isInteger(Page)),
    ),
  ).pipe(
    startWith({ Page: 0, Size: 0 }),
    bufferCount(2, 1),
    filter(
      ([prevPagination, currPagination]) =>
        Math.floor(prevPagination.Page) < Math.floor(currPagination.Page),
    ),
    map(([_, currPagination]) => currPagination),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  //#enregion ON PAGE CHANGES
}
