import { Directive, ElementRef, EventEmitter, Output } from '@angular/core';

@Directive({
  selector: '[impIsContentOverflowing]',
  standalone: true,
})
export class IsContentOverflowingDirective {
  private isContentOverflowing = false;
  @Output('impIsContentOverflowing') isContentOverflowingEmitter: EventEmitter<{
    element: HTMLElement;
    isContentOverflowing: boolean;
  }> = new EventEmitter<{
    element: HTMLElement;
    isContentOverflowing: boolean;
  }>();
  constructor(private el: ElementRef<HTMLElement>) {
    const element = this.el.nativeElement;
    const mutationObserver = new MutationObserver(() =>
      this.checkIfContentIsOverflowing(element),
    );
    mutationObserver.observe(element, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
    const resizeObserver = new ResizeObserver(() =>
      this.checkIfContentIsOverflowing(element),
    );
    resizeObserver.observe(element);
  }

  private checkIfContentIsOverflowing(element: HTMLElement) {
    const { clientHeight, scrollHeight } = element;
    const isContentOverflowing = scrollHeight > clientHeight;
    if (isContentOverflowing === this.isContentOverflowing) return;
    this.isContentOverflowing = isContentOverflowing;
    element.classList.toggle('is-content-overflowing', isContentOverflowing);
    this.isContentOverflowingEmitter.emit({
      element,
      isContentOverflowing,
    });
  }
}
