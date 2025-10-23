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
import { ImpResizeEventsDirective } from '@imperiascm/dom-utils';
import { ImperiaTableV2Component } from '../components/imperia-table-v2/imperia-table-v2.component';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';
import { ImperiaTableBodyCellContextMenuContext } from '../template-directives/imperia-table-body-cell-context-menu-template.directive';
import {
  Observable,
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
} from 'rxjs';
import { ImperiaTableV3Component } from '../../imperia-table-v3/components/imperia-table-v3/imperia-table-v3.component';

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

  private onCellElementClick$: Observable<DataCellClickElementValue> =
    fromEvent<MouseEvent>(this.el.nativeElement, 'contextmenu').pipe(
      withLatestFrom(
        defer(() => {
          if (this.table instanceof ImperiaTableV2Component) {
            return this.table.hasImperiaTableFilterV2$;
          } else {
            return this.table.hasImperiaTableV3Filters$;
          }
        }),
        this.table.hasSelection$,
        this.table.hasRowContextMenuCustomButton$,
        defer(() => {
          if (this.table instanceof ImperiaTableV2Component) {
            return this.table.hasRowDetail$;
          } else {
            return of(false);
          }
        })
      ),
      filter(
        ([
          event,
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
      withLatestFrom(this.table.canCloseContextMenu$),
      filter(([event, canCloseContextMenu]) => canCloseContextMenu),
      map(([event]) => event),
      tap(() => this.vcr.clear()),
      map(
        () =>
          new DataCellClickElementValue(this.el, this.vcr.element.nativeElement)
      )
    );

  private contextMenuContainer$: Observable<HTMLDivElement> =
    this.onCellElementClick$.pipe(
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

  private onOutsideContextMenuClick = this.contextMenuContainer$
    .pipe(
      switchMap((menuContainer) =>
        merge(
          fromEvent<MouseEvent>(document, 'click').pipe(
            filter((event) => !menuContainer.contains(event.target as Node))
          )
        ).pipe(
          withLatestFrom(this.table.canCloseContextMenu$),
          filter(([event, canCloseContextMenu]) => canCloseContextMenu),
          mergeWith(this.table.onScroll),
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
