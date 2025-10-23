import {
  Directive,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  SkipSelf,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { ImperiaTableV2Component } from '../components/imperia-table-v2/imperia-table-v2.component';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { ImperiaTableHeaderCellContextMenuContext } from '../template-directives/imperia-table-header-cell-context-menu-template.directive';
import {
  Observable,
  defer,
  filter,
  fromEvent,
  map,
  merge,
  mergeWith,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ImperiaTableV3Component } from '../../imperia-table-v3/components/imperia-table-v3/imperia-table-v3.component';

class HeaderCellClickElementValue {
  top: number = 0;
  left: number = 0;
  containerRight: number = 0;
  constructor(el: ElementRef<HTMLTableCellElement>, container: HTMLDivElement) {
    const {
      top: containerTop,
      right: containerRight,
      left: containerLeft,
    } = container.getBoundingClientRect();
    const {
      bottom: cellBottom,
      right: cellRight,
      height: cellHeight,
      width: cellWidth,
    } = el.nativeElement.getBoundingClientRect();
    this.top = cellBottom - containerTop - cellHeight / 2;
    this.left = cellRight - containerLeft - cellWidth / 2;
    this.containerRight = containerRight;
  }
}

@Directive({
  selector: '[headerCellContextMenu]',
  standalone: true,
})
export class HeaderCellContextMenuDirective<TItem extends object>
  implements OnDestroy
{
  @Input('headerCellContextMenu')
  template!: TemplateRef<ImperiaTableHeaderCellContextMenuContext<TItem>>;
  @Input('headerCellContextMenuCol') col!: ImperiaTableColumn<TItem>;

  private onCellElementClick$ = merge(
    fromEvent<MouseEvent>(this.el.nativeElement, 'contextmenu'),
    fromEvent<MouseEvent>(this.el.nativeElement, 'click')
  ).pipe(
    withLatestFrom(
      defer(() => {
        if (this.table instanceof ImperiaTableV2Component) {
          return this.table.hasImperiaTableFilterV2$;
        } else {
          return this.table.hasImperiaTableV3Filters$;
        }
      }),
      defer(() => {
        if (this.table instanceof ImperiaTableV2Component) {
          return of(true);
        } else {
          return this.table.hasImperiaTableV3Sort$;
        }
      })
    ),
    filter(
      ([event, hasFilters, hasSort]) =>
        (this.col.allowFilter && hasFilters) || (this.col.sortable && hasSort)
    ),
    tap(([event]) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.vcr.clear();
    }),
    map(
      () =>
        new HeaderCellClickElementValue(this.el, this.vcr.element.nativeElement)
    )
  );

  private contextMenuContainer$: Observable<HTMLDivElement> =
    this.onCellElementClick$.pipe(
      map(({ top, left, containerRight }) => ({
        menu: this.vcr.createEmbeddedView(this.template, {
          $implicit: {
            col: this.col,
            top,
            left,
            close: () => this.vcr.clear(),
          },
        }),
        top,
        left,
        containerRight,
      })),
      tap(({ menu }) => menu.detectChanges()),
      map(({ menu, top, left, containerRight }) => ({
        menuContainer: menu.rootNodes.find(
          (node) => node instanceof HTMLDivElement
        ) as HTMLDivElement,
        menu,
        top,
        left,
        containerRight,
      })),
      tap(({ menuContainer, menu, top, left, containerRight }) => {
        const { right: menuRight, width: menuWidth } =
          menuContainer.getBoundingClientRect();

        if (menuRight > containerRight) {
          menu.context.$implicit.left = left - menuWidth;
          menu.detectChanges();
        }
      }),
      map(({ menuContainer }) => menuContainer)
    );

  private onOutsideContextMenuClick = this.contextMenuContainer$
    .pipe(
      switchMap((menuContainer) =>
        merge(
          fromEvent<MouseEvent>(document, 'click').pipe(
            filter((event) => !menuContainer.contains(event.target as Node))
          )
        ).pipe(
          mergeWith(this.table.onHorizontalScroll$),
          tap(() => this.vcr.clear())
        )
      )
    )
    .subscribe();

  constructor(
    @Inject(ImperiaTableV2Component<TItem>)
    private table:
      | ImperiaTableV2Component<TItem>
      | ImperiaTableV3Component<TItem>,
    private el: ElementRef<HTMLTableCellElement>,
    @SkipSelf() private vcr: ViewContainerRef
  ) {}

  ngOnDestroy(): void {
    this.onOutsideContextMenuClick.unsubscribe();
  }
}
