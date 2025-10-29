import {
  CdkVirtualScrollViewport,
  VIRTUAL_SCROLL_STRATEGY,
  VirtualScrollStrategy,
} from '@angular/cdk/scrolling';
import { Directive, Host, Inject, Input, forwardRef } from '@angular/core';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';
import { IMPERIA_TABLE_V2_HOST } from '../../shared/template-apis/imperia-table.tokens';
import type { ImperiaTableV2Host } from '../../shared/template-apis/imperia-table.tokens';
import { Observable, Subject, distinctUntilChanged } from 'rxjs';

@Directive({
  selector: '[imperiaTableV2VirtualScrollStrategy]',
  standalone: true,
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: <TItem extends object>(
        d: ImperiaTableV2VirtualScrollStrategyDirective<TItem>
      ) => d._scrollStrategy,
      deps: [forwardRef(() => ImperiaTableV2VirtualScrollStrategyDirective)],
    },
  ],
})
export class ImperiaTableV2VirtualScrollStrategyDirective<
  TItem extends object
> {
  @Input('headerHeight') set headerHeightSetter(v: number | null) {
    if (v === null) return;
    this._scrollStrategy.updateHeaderHeight(v);
  }

  @Input('rows') set rowsSetter(v: ImperiaTableRow<TItem>[]) {
    this._scrollStrategy.updateRows(v);
  }

  @Input('footerHeight') set footerHeightSetter(v: number | null) {
    if (v === null) return;
    this._scrollStrategy.updateFooterHeight(v);
  }

  _scrollStrategy: ImperiaTableV2VirtualScrollStrategy<TItem>;

  constructor(@Inject(IMPERIA_TABLE_V2_HOST) table: ImperiaTableV2Host<TItem>) {
    this._scrollStrategy = new ImperiaTableV2VirtualScrollStrategy(table);
  }
}

class ImperiaTableV2VirtualScrollStrategy<TItem extends object>
  implements VirtualScrollStrategy
{
  private viewport!: CdkVirtualScrollViewport | null;
  private wrapper!: ChildNode | null;

  private headerHeight: number = 0;
  private footerHeight: number = 0;

  private rows: ImperiaTableRow<TItem>[] = [];
  private rowsHeightCache: Map<
    TItem[Extract<keyof TItem, string>] | number,
    { value: number; from: 'calc' | 'node' }
  > = new Map<
    TItem[Extract<keyof TItem, string>] | number,
    { value: number; from: 'calc' | 'node' }
  >();

  _scrolledIndexChange = new Subject<number>();
  scrolledIndexChange: Observable<number> = this._scrolledIndexChange.pipe(
    distinctUntilChanged()
  );

  constructor(private table: ImperiaTableV2Host<TItem>) {}

  attach(viewport: CdkVirtualScrollViewport): void {
    this.viewport = viewport;
    this.wrapper = viewport.getElementRef().nativeElement.childNodes[0];
    this.viewport.setTotalContentSize(this.totalHeight());
    this.updateRenderedRange();
  }

  detach(): void {
    this.viewport = null;
    this.wrapper = null;
  }

  onContentScrolled(): void {
    this.viewport && this.updateRenderedRange();
  }

  onDataLengthChanged(): void {
    if (!this.viewport) return;

    this.viewport.setTotalContentSize(this.totalHeight());
    this.updateRenderedRange();
  }

  scrollToIndex(index: number, behavior: ScrollBehavior): void {
    this.viewport &&
      this.viewport.scrollToOffset(this.offsetByIndex(index), behavior);
  }

  public updateHeaderHeight(v: number) {
    this.headerHeight = v;
    if (this.viewport) {
      this.viewport.checkViewportSize();
      this.updateRenderedRange();
    }
  }

  public updateRows(v: ImperiaTableRow<TItem>[]) {
    this.rows = v;
    if (this.viewport) {
      this.viewport.checkViewportSize();
    }
  }

  public updateFooterHeight(v: number) {
    this.footerHeight = v;
    if (this.viewport) {
      this.viewport.checkViewportSize();
      this.updateRenderedRange();
    }
  }

  private rowHeight(row: ImperiaTableRow<TItem>): number {
    const cachedHeight = this.rowsHeightCache.get(row.dataKeyValue);

    if (cachedHeight) return cachedHeight.value;

    this.rowsHeightCache.set(row.dataKeyValue, {
      value: row.height,
      from: 'calc',
    });

    return row.height;
  }

  private rowsHeight(rows: ImperiaTableRow<TItem>[]): number {
    return rows.reduce((total, row) => total + this.rowHeight(row), 0);
  }

  private totalHeight(): number {
    return this.rowsHeight(this.rows);
  }

  public offsetByIndex(index: number): number {
    return this.rowsHeight(this.rows.slice(0, index));
  }

  private indexByOffset(offset: number): number {
    let sumOffset = 0;
    for (let i = 0; i < this.rows.length; i++) {
      sumOffset += this.rowHeight(this.rows[i]);
      if (sumOffset >= offset) {
        return i;
      }
    }
    return 0;
  }

  private numOfVisibleRows(startAtIndex: number): number {
    if (!this.viewport) return 0;
    const viewportSize = this.viewport.getViewportSize();
    let sumOfVisibleRowsHeight = 0;
    for (let i = startAtIndex; i < this.rows.length; i++) {
      sumOfVisibleRowsHeight += this.rowHeight(this.rows[i]);
      if (sumOfVisibleRowsHeight >= viewportSize) {
        return i - startAtIndex + 1;
      }
    }
    return this.rows.length - startAtIndex + 1;
  }

  private updateRenderedRange() {
    if (!this.viewport) return;

    // ensures that some rows are pre-rendered above and below the visible area
    //for a better scroll experience
    const preRenderRowsAbove = 3;
    const preRenderRowsBelow = 3;

    const scrollOffset = this.viewport.measureScrollOffset();
    const firstVisibleRowIndex = this.indexByOffset(scrollOffset);
    const dataLength = this.viewport.getDataLength();
    const { start, end } = this.viewport.getRenderedRange();
    const range = { start, end };

    range.start = Math.max(0, firstVisibleRowIndex - preRenderRowsAbove);
    range.end = Math.min(
      dataLength,
      firstVisibleRowIndex +
        this.numOfVisibleRows(firstVisibleRowIndex) +
        preRenderRowsBelow
    );

    this.viewport && this.viewport.setRenderedRange(range);
    this.viewport &&
      this.viewport.setRenderedContentOffset(this.offsetByIndex(range.start));
    this._scrolledIndexChange.next(firstVisibleRowIndex);

    //this.updateRowHeightCache();
  }

  private updateRowHeightCache() {
    if (!this.viewport || !this.wrapper) return;

    const nodes = this.wrapper.childNodes;
    let cacheHasBeenUpdated: boolean = false;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i] as HTMLElement;
      if (!node || node.nodeName !== 'TR') continue;

      const dataKeyValue = node.dataset['dataKeyValue'] as any as TItem[Extract<
        keyof TItem,
        string
      >];
      const cachedHeight = this.rowsHeightCache.get(dataKeyValue);

      if (cachedHeight && cachedHeight.from === 'node') continue;

      this.rowsHeightCache.set(dataKeyValue, {
        value: node.clientHeight,
        from: 'node',
      });

      cacheHasBeenUpdated = true;
    }

    if (!cacheHasBeenUpdated) return;

    this.viewport.setTotalContentSize(this.totalHeight());
  }

  onContentRendered(): void {
    /** no-op */
  }

  onRenderedOffsetChanged(): void {
    /** no-op */
  }
}
