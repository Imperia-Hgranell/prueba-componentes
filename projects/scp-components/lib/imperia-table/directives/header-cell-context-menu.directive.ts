import {
  Directive,
  ElementRef,
  Host,
  Inject,
  Input,
  OnDestroy,
  Optional,
  SkipSelf,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { ImperiaTableHeaderCellContextMenuContext } from '../template-directives/imperia-table-header-cell-context-menu-template.directive';
import {
  type Observable,
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
  EMPTY,
  type Subscription,
} from 'rxjs';
import {
  IMPERIA_TABLE_V2_HOST,
  IMPERIA_TABLE_V3_HOST,
  type ImperiaTableV2Host,
  type ImperiaTableV3Host,
} from '../../shared/template-apis/imperia-table.tokens';

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

  private readonly onCellElementClick$: Observable<HeaderCellClickElementValue>;
  private readonly contextMenuContainer$: Observable<HTMLDivElement>;
  private readonly onOutsideContextMenuClick: Subscription;

  constructor(
    @Optional()
    @Host()
    @Inject(IMPERIA_TABLE_V2_HOST)
    private readonly v2Host: ImperiaTableV2Host<TItem> | null,
    @Optional()
    @Host()
    @Inject(IMPERIA_TABLE_V3_HOST)
    private readonly v3Host: ImperiaTableV3Host<TItem> | null,
    private readonly el: ElementRef<HTMLTableCellElement>,
    @SkipSelf() private readonly vcr: ViewContainerRef
  ) {
    this.onCellElementClick$ = this.createOnCellElementClick$();
    this.contextMenuContainer$ = this.createContextMenuContainer$();
    this.onOutsideContextMenuClick = this.createOnOutsideContextMenuClick();
  }

  ngOnDestroy(): void {
    this.onOutsideContextMenuClick.unsubscribe();
  }

  private createOnCellElementClick$(): Observable<HeaderCellClickElementValue> {
    return merge(
      fromEvent<MouseEvent>(this.el.nativeElement, 'contextmenu'),
      fromEvent<MouseEvent>(this.el.nativeElement, 'click')
    ).pipe(
      withLatestFrom(this.resolveHasFilters$(), this.resolveHasSort$()),
      filter(
        ([, hasFilters, hasSort]) =>
          (this.col.allowFilter && hasFilters) ||
          (this.col.sortable && hasSort)
      ),
      tap(([event]) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.vcr.clear();
      }),
      map(
        () =>
          new HeaderCellClickElementValue(
            this.el,
            this.vcr.element.nativeElement
          )
      )
    );
  }

  private createContextMenuContainer$(): Observable<HTMLDivElement> {
    return this.onCellElementClick$.pipe(
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
  }

  private createOnOutsideContextMenuClick(): Subscription {
    return this.contextMenuContainer$
      .pipe(
        switchMap((menuContainer) =>
          merge(
            fromEvent<MouseEvent>(document, 'click').pipe(
              filter((event) => !menuContainer.contains(event.target as Node))
            )
          ).pipe(
            mergeWith(
              this.resolveObservable(
                (host) => host.onHorizontalScroll$,
                EMPTY as Observable<unknown>
              )
            ),
            tap(() => this.vcr.clear())
          )
        )
      )
      .subscribe();
  }

  private resolveObservable<TResult>(
    resolver: (
      host: ImperiaTableV2Host<TItem> | ImperiaTableV3Host<TItem>
    ) => Observable<TResult>,
    fallback: Observable<TResult>
  ): Observable<TResult> {
    return defer(() => {
      const host = this.v2Host ?? this.v3Host;
      return host ? resolver(host) : fallback;
    });
  }

  private resolveHasFilters$(): Observable<boolean> {
    return defer(() => {
      if (this.v3Host) {
        return this.v3Host.hasImperiaTableV3Filters$;
      }
      if (this.v2Host) {
        return this.v2Host.hasImperiaTableFilterV2$;
      }
      return of(false);
    });
  }

  private resolveHasSort$(): Observable<boolean> {
    return defer(() => {
      if (this.v3Host) {
        return this.v3Host.hasImperiaTableV3Sort$;
      }
      if (this.v2Host) {
        return of(true);
      }
      return of(false);
    });
  }
}
