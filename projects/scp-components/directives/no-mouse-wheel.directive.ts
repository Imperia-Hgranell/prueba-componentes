import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: 'input[type=number][step=0]',
  host: {
    class: 'no-mouse-wheel',
  },
  standalone: true,
})
export class NoMouseWheelDirective {
  constructor(el: ElementRef<HTMLInputElement>) {
    el.nativeElement.addEventListener('wheel', (e) => e.preventDefault());
  }
}
