import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ImpResizeEventsDirective,
  ImpScrollEventsDirective,
} from '@imperiascm/dom-utils';
export function binaryFindIndex<T>(
  array: T[],
  predicate: (value: T) => boolean,
  start: number = 0,
  end: number = array.length
): number {
  while (start < end) {
    const middle = start + Math.floor((end - start) / 2);
    if (predicate(array[middle])) {
      end = middle;
    } else {
      start = middle + 1;
    }
  }
  return start;
}
@Directive({
  selector: '[virtual-for]',
  standalone: true,
  exportAs: 'virtualFor',
})
export class VirtualForDirective<TItem extends object> {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly resize = new ImpResizeEventsDirective(this.elementRef);
  public $onHeightChange = toSignal(this.resize.onHeightChange$);
  private readonly scroll = new ImpScrollEventsDirective(this.elementRef);
  public $onVerticalScroll = toSignal(this.scroll.onVerticalScroll$);
  public $rows = input.required<TItem[], TItem[] | null | undefined>({
    alias: 'virtual-for',
    transform: (value) => value ?? [],
  });
  public $rowHeight = input.required<
    (item: TItem) => number,
    number | ((item: TItem) => number)
  >({
    transform: (height) => (typeof height === 'number' ? () => height : height),
  });

  private $rowsHeightCache = computed(() => {
    const rows = this.$rows();
    const rowHeight = this.$rowHeight();

    return rows.reduce<number[]>(
      (acc, item) => [...acc, (acc[acc.length - 1] ?? 0) + rowHeight(item)],
      []
    );
  });

  public isAtBottom = output<number>();

  public visible = computed(() => {
    const onVerticalScroll = this.$onVerticalScroll();
    const onHeightChangeEnd = this.$onHeightChange();

    if (!onVerticalScroll || !onHeightChangeEnd) {
      return {
        all: [],
        top: 0,
        visible: [],
        rendered: [],
        bottom: 0,
      };
    }

    const { scroll } = onVerticalScroll;
    const { DOMRect } = onHeightChangeEnd;

    const rowsHeightCache = this.$rowsHeightCache();

    const firstVisibleRowIndex = binaryFindIndex(
      rowsHeightCache,
      (height) => height >= scroll.top
    );

    const rows = this.$rows();

    const lastVisibleRowIndex = Math.min(
      binaryFindIndex(
        rowsHeightCache,
        (height) => height >= scroll.top + DOMRect.height
      ),
      rows.length - 1
    );

    if (lastVisibleRowIndex == rows.length - 1)
      this.isAtBottom.emit(lastVisibleRowIndex);

    return {
      all: rows,
      top: rowsHeightCache[firstVisibleRowIndex - 1] ?? 0,
      visible: rows.slice(firstVisibleRowIndex, lastVisibleRowIndex + 1),
      bottom:
        rowsHeightCache[rowsHeightCache.length - 1 - lastVisibleRowIndex - 1] ??
        0,
    };
  });
}
