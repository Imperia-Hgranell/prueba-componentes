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
import { ImpResizeEventsDirective } from '@imperiascm/dom-utils';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';
import { ImperiaTableBodyCellContextMenuContext } from '../template-directives/imperia-table-body-cell-context-menu-template.directive';
import {
  type Observable,
  defer,
  filter,
  fromEvent,
  map,
  merge,
  mergeWith,
  of,
  shareReplay,
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

class DataCellClickElementValue {
  top: number = 0;
  left: number = 0;
  containerRight: number = 0;
  containerBottom: number = 0;
  constructor(el: ElementRef<HTMLTableCellElement>, container: HTMLDivElement) {
    const {
      top: containerTop,
      right: containerRight,
      bottom: containerBottom,
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
    this.containerBottom = containerBottom;
  }
}

@Directive({
  selector: '[bodyCellContextMenu]',
  standalone: true,
})
export class BodyCellContextMenuDirective<TItem extends object>
  implements OnDestroy
{
  @Input('bodyCellContextMenu')
  template!: TemplateRef<ImperiaTableBodyCellContextMenuContext<TItem>>;
  @Input('bodyCellContextMenuCol') col!: ImperiaTableColumn<TItem>;
  @Input('bodyCellContextMenuRow') row!: ImperiaTableRow<TItem>;

  private readonly onCellElementClick$: Observable<DataCellClickElementValue>;
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

  private createOnCellElementClick$(): Observable<DataCellClickElementValue> {
    return fromEvent<MouseEvent>(this.el.nativeElement, 'contextmenu').pipe(
      withLatestFrom(
        this.resolveHasFilters$(),
        this.resolveObservable((host) => host.hasSelection$, of(false)),
        this.resolveObservable(
          (host) => host.hasRowContextMenuCustomButton$,
          of(false)
        ),
        this.resolveV2Observable((host) => host.hasRowDetail$, of(false))
      ),
      filter(
        ([
          ,
          hasFilters,
          hasSelection,
          hasRowContextMenuCustomButtons,
          hasRowDetail,
        ]) =>
          (this.col.allowFilter && hasFilters) ||
          hasSelection ||
          hasRowContextMenuCustomButtons ||
          hasRowDetail
      ),
      map(([event]) => event),
      tap((event) => event.preventDefault()),
      withLatestFrom(
        this.resolveObservable((host) => host.canCloseContextMenu$, of(false))
      ),
      filter(([, canCloseContextMenu]) => canCloseContextMenu),
      map(([event]) => event),
      tap(() => this.vcr.clear()),
      map(
        () =>
          new DataCellClickElementValue(this.el, this.vcr.element.nativeElement)
      )
    );
  }

  private createContextMenuContainer$(): Observable<HTMLDivElement> {
    return this.onCellElementClick$.pipe(
      map(({ top, left, containerRight, containerBottom }) => ({
        menu: this.vcr.createEmbeddedView(this.template, {
          $implicit: {
            col: this.col,
            row: this.row,
            top,
            left,
            close: () => this.vcr.clear(),
          },
        }),
        top,
        left,
        containerRight,
        containerBottom,
      })),
      tap(({ menu }) => menu.detectChanges()),
      map(({ menu, top, left, containerRight, containerBottom }) => ({
        menuContainer: menu.rootNodes.find(
          (node) => node instanceof HTMLDivElement
        ) as HTMLDivElement,
        menu,
        top,
        left,
        containerRight,
        containerBottom,
      })),
      tap(
        ({
          menuContainer,
          menu,
          top,
          left,
          containerRight,
          containerBottom,
        }) => {
          const onResizeMenuContainer = new ImpResizeEventsDirective(
            new ElementRef(menuContainer)
          ).onSizeChange$
            .pipe(
              tap(({ DOMRect: { width, height } }) => {
                if (left + width > containerRight) {
                  menu.context.$implicit.left = left - width;
                  menu.detectChanges();
                }
                if (top + height * 2 > containerBottom) {
                  menu.context.$implicit.top = top - height;
                  menu.detectChanges();
                }
              })
            )
            .subscribe();
          menu.onDestroy(() => onResizeMenuContainer.unsubscribe());
        }
      ),
      map(({ menuContainer }) => menuContainer),
      shareReplay({
        bufferSize: 1,
        refCount: true,
      })
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
            withLatestFrom(
              this.resolveObservable(
                (host) => host.canCloseContextMenu$,
                of(false)
              )
            ),
            filter(([, canCloseContextMenu]) => canCloseContextMenu),
            mergeWith(
              this.resolveObservable(
                (host) => host.onScroll,
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

  private resolveV2Observable<TResult>(
    resolver: (host: ImperiaTableV2Host<TItem>) => Observable<TResult>,
    fallback: Observable<TResult>
  ): Observable<TResult> {
    return defer(() => (this.v2Host ? resolver(this.v2Host) : fallback));
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
}
