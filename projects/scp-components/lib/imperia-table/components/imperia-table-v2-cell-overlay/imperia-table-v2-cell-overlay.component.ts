import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Directive,
  EmbeddedViewRef,
  input,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
// TODO: ESTO HAY QUE SOLUCIONARLO, PORQUE NO PUEDE HAVER IMPORTS DE MODULES EN ALGO SHARED
// import { ForecastsConceptsService } from '@modules/forecasts-concept/services/forecasts-concepts.service';
// import { CellForecastConceptsComponent } from '@modules/forecasts/components/cell-forecast-concepts/cell-forecast-concepts.component';
import { FADEIN_FADEOUT } from '@imperiascm/scp-utils/animations';
import { ImperiaTableV2CellValueRestorerComponent } from '../imperia-table-v2-cell-value-restorer/imperia-table-v2-cell-value-restorer.component';
import { ImperiaTableV2Component } from '../imperia-table-v2/imperia-table-v2.component';
import { ImperiaTableV2ClickEvent } from '../../directives/imperia-table-v2-clicks.directive';
import { isElementClickedOverlappingParentElement } from '@imperiascm/scp-utils/functions';
import { DEFAULT_ORDER } from '@imperiascm/scp-utils/payload';
import { DEFAULT_PAGINATION } from '@imperiascm/scp-utils/payload';
import { DEFAULT_SEARCH } from '@imperiascm/scp-utils/payload';
import {
  BehaviorSubject,
  combineLatest,
  EMPTY,
  filter,
  first,
  from,
  fromEvent,
  map,
  merge,
  Observable,
  of,
  ReplaySubject,
  scan,
  share,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { CellCorner } from '@imperiascm/scp-utils/models';

export type ImperiaTableCellOverlayContext<TItem extends object> = {
  $implicit: {
    top: number | null;
    left: number | null;
    bottom: number | null;
    right: number | null;
    maxHeight: number;
    maxWidth: number;
    cellPointerAt: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    event: ImperiaTableV2ClickEvent<TItem>;
    pinned: boolean;
  };
};

@Directive({
  selector: '[imperia-table-v2-cell-overlay-template]',
  standalone: false,
})
export class ImperiaTableV2CellOverlayTemplateDirective<TItem extends object> {
  @Input('imperia-table-v2-cell-overlay-template') type: string | null = null;

  constructor(
    public template: TemplateRef<ImperiaTableCellOverlayContext<TItem>>
  ) {}

  static ngTemplateContextGuard<TItem extends object>(
    dir: ImperiaTableV2CellOverlayTemplateDirective<TItem>,
    ctx: unknown
  ): ctx is ImperiaTableCellOverlayContext<TItem> {
    return true;
  }
}

export class ImperiaTableV2CellOverlayRef<TItem extends object> {
  embeddedView: EmbeddedViewRef<ImperiaTableCellOverlayContext<TItem>>;
  element: HTMLElement;
  event: ImperiaTableV2ClickEvent<TItem>;

  private _hasBeenAtemptedToClose: boolean = false;
  get hasBeenAtemptedToClose() {
    return this._hasBeenAtemptedToClose;
  }

  private _canBeClosed: boolean = true;
  get canBeClosed() {
    return this._canBeClosed;
  }

  constructor(
    embeddedView: EmbeddedViewRef<ImperiaTableCellOverlayContext<TItem>>,
    element: HTMLElement,
    event: ImperiaTableV2ClickEvent<TItem>
  ) {
    this.embeddedView = embeddedView;
    this.element = element;
    this.event = event;
  }

  public attemptedToClose() {
    this._hasBeenAtemptedToClose = true;
  }

  public closable(v: boolean) {
    this._canBeClosed = v;
  }
}
/**
 * !! `<imperia-table-v2-cell-overlay></imperia-table-v2-cell-overlay>` WONT BE OPENED IF `<imperia-table-v2-clicks></imperia-table-v2-clicks>` IS NOT INSIDE `<imperia-table-v2></imperia-table-v2>` !!
 */
@Component({
  selector: 'imperia-table-v2-cell-overlay',
  templateUrl: './imperia-table-v2-cell-overlay.component.html',
  styleUrls: ['./imperia-table-v2-cell-overlay.component.scss'],
  animations: [FADEIN_FADEOUT],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV2CellOverlayComponent<TItem extends object>
  implements OnInit, OnDestroy
{
  private destroy = new Subject<void>();

  //#region CLOSE FROM OUTSIDE
  public $closeFromOutside = input<boolean | null>(null, {
    alias: 'closeFromOutside',
  });
  public closeFromOutside$ = toObservable(this.$closeFromOutside).pipe(
    filter(Boolean)
  );
  //#endregion CLOSE FROM OUTSIDE

  //#region OVERLAY
  @Input('openIf') openIfFn: (
    event: ImperiaTableV2ClickEvent<TItem>
  ) => boolean | Observable<boolean> | Promise<boolean> = () => true;

  @ViewChild('overlay', { static: true })
  overlay!: TemplateRef<ImperiaTableCellOverlayContext<TItem>>;
  //#endregion OVERLAY

  //#region CELL VALUE RESTORERS
  public cellValueRestorerComponents = new BehaviorSubject<
    ImperiaTableV2CellValueRestorerComponent<TItem, any>[]
  >([]);
  public onCellValueRestored$ = this.cellValueRestorerComponents.pipe(
    switchMap((cellValueRestorerComponents) =>
      merge(
        ...cellValueRestorerComponents.map(
          (cellValueRestorerComponent) =>
            cellValueRestorerComponent.onRestoreSuccess$
        )
      )
    ),
    share(),
    takeUntil(this.destroy)
  );
  //#endregion CELL VALUE RESTORERS

  //#region CELL FORECAST CONCEPTS
  // TODO: HAY QUE SOLUCIONAR ESTO
  // public cellForecastConceptsComponent = new BehaviorSubject<
  //   CellForecastConceptsComponent<TItem> | undefined
  // >(undefined);
  // public forecastConceptsList$ = this.cellForecastConceptsComponent.pipe(
  //   filter(Boolean),
  //   take(1),
  //   switchMap((cellForecastConceptsComponent) =>
  //     cellForecastConceptsComponent
  //       ? this.forecastConceptsService
  //           .getList({
  //             Filters: [],
  //             Order: DEFAULT_ORDER as any,
  //             Pagination: DEFAULT_PAGINATION,
  //             Search: DEFAULT_SEARCH,
  //           })
  //           .pipe(map((resp) => (resp.ok ? resp.data.Data : [])))
  //       : of([])
  //   ),
  //   startWith([]),
  //   shareReplay(1),
  //   takeUntil(this.destroy)
  // );
  public onCellForecastConceptDeleted$ = of({
    clickEvent: {} as ImperiaTableV2ClickEvent<any>,
  });
  // this.cellForecastConceptsComponent.pipe(
  //   switchMap(
  //     (cellForecastConceptsComponent) =>
  //       cellForecastConceptsComponent?.onDeleteSuccess$ ?? EMPTY
  //   ),
  //   takeUntil(this.destroy)
  // );
  //#endregion CELL FORECAST CONCEPTS

  //#region TEMPLATES
  @ContentChildren(ImperiaTableV2CellOverlayTemplateDirective)
  set templatesSetter(
    v: QueryList<ImperiaTableV2CellOverlayTemplateDirective<TItem>>
  ) {
    this.templateDirectives.next(v);
  }
  private templateDirectives = new ReplaySubject<
    QueryList<ImperiaTableV2CellOverlayTemplateDirective<TItem>>
  >(1);
  private templatesDirectives$: Observable<
    ImperiaTableV2CellOverlayTemplateDirective<TItem>[]
  > = this.templateDirectives.pipe(
    first(),
    switchMap((templates) =>
      templates.changes.pipe(startWith(templates.toArray()))
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion TEMPLATES

  //#region TITLE TEMPLATE
  @ViewChild('defaultTitleTemplate', { static: true })
  public defaultTitleTemplate!: TemplateRef<
    ImperiaTableCellOverlayContext<TItem>
  >;
  public titleTemplate$ = this.templatesDirectives$.pipe(
    map((templatesDirectives) =>
      templatesDirectives.find(({ type }) => type === 'title')
    ),
    map((templatesDirective) => templatesDirective?.template)
  );
  //#endregion TITLE TEMPLATE

  //#region CONTENT TEMPLATE
  @ViewChild('defaultContentTemplate', { static: true })
  public defaultContentTemplate!: TemplateRef<
    ImperiaTableCellOverlayContext<TItem>
  >;
  public contentTemplate$ = this.templatesDirectives$.pipe(
    map((templatesDirectives) =>
      templatesDirectives.find(({ type }) => type === 'content')
    ),
    map((templatesDirective) => templatesDirective?.template)
  );
  //#endregion CONTENT TEMPLATE

  //#region PINNABLE
  @Input('pinnable') set pinnableSetter(v: boolean | null) {
    this.pinnable.next(!!v);
  }
  private pinnable = new BehaviorSubject<boolean>(true);

  public pinnable$ = combineLatest([
    this.table.hasSelection$,
    this.table.hasClickEvents$,
    this.pinnable,
  ]).pipe(
    map(
      ([hasSelection, hasClickEvents, pinnable]) =>
        hasSelection && hasClickEvents && pinnable
    )
  );
  //#endregion PINNABLE

  //#region PIN
  public pin = new Subject<
    ImperiaTableCellOverlayContext<TItem>['$implicit']
  >();
  public onPin$ = this.pin.pipe(tap((event) => (event.pinned = true)));
  //#endregion PIN

  //#region ON OPEN
  public onOpen$ = this.table.singleClick$.pipe(
    filter(
      (singleClick) =>
        !(singleClick.event.shiftKey || singleClick.event.ctrlKey)
    ),
    switchMap((singleClick) =>
      this.toObservable(this.openIfFn(singleClick)).pipe(
        take(1),
        filter(Boolean),
        map(() => singleClick)
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion ON OPEN

  //#region OVERLAY
  private overlay$ = this.onOpen$.pipe(
    withLatestFrom(this.table.filtersTableContainer$),
    map(([event, filtersTableContainer]) => {
      const cellRect = event.element.getBoundingClientRect();

      const _embeddedViewRef = this.table.cellOverlayVcr.createEmbeddedView(
        this.overlay,
        {
          $implicit: {
            ...this.getPosition(
              cellRect,
              filtersTableContainer.getBoundingClientRect(),
              document.documentElement.getBoundingClientRect()
            ),
            event,
            pinned: false,
          },
        }
      );

      _embeddedViewRef.detectChanges();

      const element: HTMLElement | undefined = _embeddedViewRef.rootNodes.find(
        ({ nodeType }) => nodeType === Node.ELEMENT_NODE
      );

      if (!element) return null;
      const overlayRef = new ImperiaTableV2CellOverlayRef(
        _embeddedViewRef,
        element,
        event
      );
      event.overlay = overlayRef;
      return overlayRef;
    }),
    filter(Boolean),
    share()
  );
  //#endregion OVERLAY

  constructor(
    private table: ImperiaTableV2Component<TItem> // private forecastConceptsService: ForecastsConceptsService
  ) {}

  ngOnInit(): void {
    this.overlay$
      .pipe(
        scan<
          ImperiaTableV2CellOverlayRef<TItem>,
          ImperiaTableV2CellOverlayRef<TItem>[]
        >((overlays, overlay) => [...overlays, overlay], []),
        switchMap((overlays) =>
          merge(
            this.closeFromOutside$.pipe(
              tap(() => {
                overlays.forEach(({ element, event, embeddedView }) => {
                  event.overlay?.attemptedToClose();
                  if (event.overlay?.canBeClosed) {
                    embeddedView.destroy();
                  }
                });
              })
            ),
            fromEvent<MouseEvent>(document, 'click').pipe(
              tap((e) =>
                overlays.forEach(({ element, event, embeddedView }) => {
                  event.overlay?.attemptedToClose();
                  if (
                    event.overlay?.canBeClosed &&
                    !element.contains(e.target as Node) &&
                    !isElementClickedOverlappingParentElement(e, element, true)
                  ) {
                    embeddedView.destroy();
                  }
                })
              )
            ),
            this.table.onHorizontalScroll$.pipe(
              tap(() =>
                overlays.forEach(({ element, event, embeddedView }) => {
                  event.overlay?.attemptedToClose();
                  if (event.overlay?.canBeClosed) {
                    embeddedView.destroy();
                  }
                })
              )
            ),
            this.table.onVerticalScroll$.pipe(
              tap(() =>
                overlays.forEach(({ event, embeddedView }) => {
                  event.overlay?.attemptedToClose();
                  if (!event.fromFooter && event.overlay?.canBeClosed) {
                    embeddedView.destroy();
                  }
                })
              )
            )
          ).pipe(map(() => overlays))
        ),
        tap(
          (overlays) =>
            (overlays = overlays.filter(
              ({ embeddedView }) => !embeddedView.destroyed
            ))
        ),
        takeUntil(this.destroy)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  private getPosition(cellRect: DOMRect, rect: DOMRect, bounds: DOMRect) {
    const closestCornerToRectCenter = this.getClosestCornerToBoundsCenter(
      bounds,
      this.getCorners(cellRect)
    );

    const top = closestCornerToRectCenter.y - rect.top;
    const left = closestCornerToRectCenter.x - rect.left;
    const bottom = rect.bottom - closestCornerToRectCenter.y;
    const right = rect.right - closestCornerToRectCenter.x;

    const atTop = closestCornerToRectCenter.name.includes('top');
    const atRight = closestCornerToRectCenter.name.includes('right');

    return {
      top: atTop ? null : top + 8,
      left: atRight ? left - cellRect.width : null,
      bottom: atTop ? bottom + 8 : null,
      right: atRight ? null : right - cellRect.width,
      maxHeight: atTop ? bounds.height - bottom : bounds.height - top,
      maxWidth: atRight ? bounds.width - left : bounds.width - right,
      cellPointerAt: `${atTop ? 'bottom' : 'top'}-${
        atRight ? 'left' : 'right'
      }` as const,
    };
  }

  private getCorners({
    top,
    left,
    bottom,
    right,
  }: DOMRect): [
    CellCorner<'top-left'>,
    CellCorner<'top-right'>,
    CellCorner<'bottom-left'>,
    CellCorner<'bottom-right'>
  ] {
    return [
      { name: 'top-left', y: top, x: left },
      { name: 'top-right', y: top, x: right },
      { name: 'bottom-left', y: bottom, x: left },
      { name: 'bottom-right', y: bottom, x: right },
    ];
  }

  private getClosestCornerToBoundsCenter(
    bounds: DOMRect,
    corners: [
      CellCorner<'top-left'>,
      CellCorner<'top-right'>,
      CellCorner<'bottom-left'>,
      CellCorner<'bottom-right'>
    ]
  ) {
    return corners.reduce<{
      distance: number;
      corner: CellCorner;
    }>(
      (acc, curr) => {
        const distance = Math.sqrt(
          Math.pow(bounds.left + bounds.width / 2 - curr.x, 2) +
            Math.pow(bounds.top + bounds.height / 2 - curr.y, 2)
        );
        return distance < acc.distance ? { distance, corner: curr } : acc;
      },
      { distance: Infinity, corner: corners[0] }
    ).corner;
  }

  private toObservable<T>(
    value: T | Observable<T> | Promise<T>
  ): Observable<T> {
    return value instanceof Observable
      ? value
      : value instanceof Promise
      ? from(value)
      : of(value);
  }
}
