import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[tooltip-on-hover]',
  standalone: true,
})
export class TooltipOnHoverDirective {
  constructor(private el: ElementRef<HTMLDivElement>) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.el.nativeElement.innerText)
      this.el.nativeElement.title = this.el.nativeElement.innerText;
  }
}
