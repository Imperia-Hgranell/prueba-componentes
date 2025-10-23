import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  Input,
  NgZone,
  QueryList,
  ViewChild,
} from '@angular/core';
import { combineLatest, map, Observable, ReplaySubject, switchMap } from 'rxjs';
import { ICONS_NAMES } from '../../../imperia-icon-button/imperia-icon-button.component';
import { ImpMenuItemDirective } from '../../directives/imp-menu-item.directive';
import {
  ImpMenuBorderPositions,
  ImpMenuSeparatorPositions,
} from '../../models/imp-menu.models';

@Component({
  selector: 'imp-menu',
  templateUrl: './imp-menu.component.html',
  styleUrls: ['./imp-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ImpMenuComponent {
  @Input() separators: ImpMenuSeparatorPositions = 'none';
  @Input() borders: ImpMenuBorderPositions = 'none';
  @Input() text = 'Menu';
  @Input() alignment: 'left' | 'center' | 'right' = 'left';
  @Input() icon: ICONS_NAMES = 'chevron-down';
  //#region CONTENTCHILDREN
  @ContentChildren(ImpMenuItemDirective)
  set menuItemsSetter(v: QueryList<ImpMenuItemDirective>) {
    this.menuItems$.next(v);
  }
  public menuItems$: ReplaySubject<QueryList<ImpMenuItemDirective>> =
    new ReplaySubject<QueryList<ImpMenuItemDirective>>(1);
  //#endregion CONTENTCHILDREN

  //#region VIEWCHILD
  @ViewChild('menuContainer') public set menuContainerSetter(
    element: ElementRef<HTMLDivElement>,
  ) {
    this.menuContainer.next(element.nativeElement);
  }
  private menuContainer: ReplaySubject<HTMLDivElement> =
    new ReplaySubject<HTMLDivElement>(1);
  @ViewChild('menuItemsWrapper') public set menuItemsWrapperSetter(
    element: ElementRef<HTMLDivElement>,
  ) {
    this.menuItemsWrapper.next(element.nativeElement);
  }
  private menuItemsWrapper: ReplaySubject<HTMLDivElement> =
    new ReplaySubject<HTMLDivElement>(1);
  //#endregion VIEWCHILD

  private menuContainerWidth$: Observable<number> = this.menuContainer.pipe(
    switchMap((menu) => this.widthChanges$(menu)),
  );
  private menuItemsWrapperWidth$: Observable<number> =
    this.menuItemsWrapper.pipe(switchMap((menu) => this.widthChanges$(menu)));

  public collapsed$: Observable<boolean> = combineLatest([
    this.menuContainerWidth$,
    this.menuItemsWrapperWidth$,
  ]).pipe(
    map(
      ([menuContainerWidth, menuItemsWrapperWidth]) =>
        menuContainerWidth < menuItemsWrapperWidth,
    ),
  );

  constructor(private ngZone: NgZone) {}

  private widthChanges$(element: HTMLElement): Observable<number> {
    return new Observable((subscriber) => {
      const resizeObserver = new ResizeObserver(([entry]) =>
        this.ngZone.run(() => subscriber.next(entry.contentRect.width)),
      );
      resizeObserver.observe(element);
      return function unsubscribe() {
        resizeObserver.unobserve(element);
      };
    });
  }
}
