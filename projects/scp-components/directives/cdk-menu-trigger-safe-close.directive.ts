import { CdkMenu, CdkMenuTrigger } from '@angular/cdk/menu';
import { Directive } from '@angular/core';
import {
  areHTMLElementsOverlapping,
  getLastElementBeforeBodyInEventPath,
} from '@imperiascm/scp-utils/functions';
import {
  asapScheduler,
  delay,
  filter,
  map,
  takeUntil,
  withLatestFrom,
} from 'rxjs';

@Directive({
  selector: '[CdkMenuTriggerSafeClose]',
  standalone: true,
})

/**
 * This directive prevents the cdkMenu with a trigger from closing when clicking
 * on an element that is not part of the menu,but is overlapping it
 * Note => Takes in consideration the body children and the imp-overlay app-root's children
 * @param el - The cdkMenuTrigger directive
 */
export class CdkMenuTriggerSafeCloseDirective {
  constructor(private el: CdkMenuTrigger) {
    const overlayRef = this.el['overlayRef'];
    if (!overlayRef) return;

    const overlappingBodyChildren$ = overlayRef.outsidePointerEvents().pipe(
      map(() => {
        const bodyChildren = Array.from(document.body.children).filter(
          (c) => !['SCRIPT', 'APP-ROOT'].includes(c.tagName.toUpperCase())
        );

        const appRoot = Array.from(document.body.children)
          .filter((c) => c.tagName.toUpperCase() === 'APP-ROOT')
          .map((c) => c as HTMLElement)[0];

        const impOverlays = Array.from(appRoot.children)
          .filter((c) => c.tagName.toUpperCase() === 'IMP-OVERLAY')
          .reduce((acc, c) => {
            return [...acc, c.firstElementChild as HTMLElement];
          }, [] as HTMLElement[]);

        const res = [...bodyChildren, ...impOverlays]
          .map((c) => c as HTMLElement)
          .filter((ch) =>
            areHTMLElementsOverlapping(
              (this.el.getMenu() as CdkMenu).nativeElement,
              ch
            )
          );
        return res;
      })
    );

    this.el['_subscribeToOutsideClicks'] = () => {
      overlayRef
        .outsidePointerEvents()
        .pipe(
          delay(0, asapScheduler),
          withLatestFrom(overlappingBodyChildren$),
          filter(([event, bodyChildren]) => {
            const target = this.getEventTarget(event) as Element;
            return !bodyChildren.some(
              (c) =>
                c.contains(target as Node) ||
                c === getLastElementBeforeBodyInEventPath(event) ||
                c.contains(getLastElementBeforeBodyInEventPath(event))
            );
          }),
          map(([event]) => event),
          takeUntil(this.el['stopOutsideClicksListener'])
        )
        .subscribe((event) => {
          const target = this.getEventTarget(event) as Element;
          const element = this.el['_elementRef'].nativeElement;
          if (target !== element && !element.contains(target)) {
            if (!this.el['isElementInsideMenuStack'](target)) {
              this.el['menuStack'].closeAll();
            } else {
              this.el['_closeSiblingTriggers']();
            }
          }
        });
    };
  }

  //note: If an event is bound outside the Shadow DOM, the `event.target` will
  //note: point to the shadow root so we have to use `composedPath` instead.
  private getEventTarget<T extends EventTarget>(event: Event): T | null {
    return (
      event.composedPath ? event.composedPath()[0] : event.target
    ) as T | null;
  }
}
