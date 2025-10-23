import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  NgZone,
  Optional,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { ImpMenuV2ItemGroupDirective } from '../../directives/imp-menu-v2-item-group.directive';
import { ImpMenuV2ItemDirective } from '../../directives/imp-menu-v2-item.directive';
import { ImperiaTableV2Component } from '../../../imperia-table/components/imperia-table-v2/imperia-table-v2.component';
import {
  Observable,
  ReplaySubject,
  auditTime,
  combineLatest,
  combineLatestWith,
  defer,
  distinctUntilChanged,
  filter,
  first,
  map,
  merge,
  of,
  pairwise,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
  withLatestFrom,
  zip,
} from 'rxjs';

@Component({
  selector: 'imp-menu-v2',
  templateUrl: './imp-menu-v2.component.html',
  styleUrls: ['./imp-menu-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImpMenuV2Component {
  //#region MENU
  @ViewChild('menu') set menuSetter(v: ElementRef<HTMLDivElement>) {
    this.menu.next(v.nativeElement);
  }
  public menu = new ReplaySubject<HTMLDivElement>(1);
  //#endregion MENU

  //#region MENU WIDTH CHANGES
  private menuWidthChange$: Observable<{
    sinceLastChangeIs: 'bigger' | 'smaller';
    menuWidth: number;
  }> = this.menu.pipe(
    switchMap((menu) => this.widthChanges$(menu, 'offset')),
    startWith(0),
    pairwise(),
    map(([prev, curr]) => ({
      sinceLastChangeIs: (prev > curr ? 'smaller' : 'bigger') as
        | 'bigger'
        | 'smaller',
      menuWidth: curr,
    })),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion MENU WIDTH CHANGES

  //#region GROUPS
  @ContentChildren(ImpMenuV2ItemGroupDirective, { descendants: true })
  set itemsGroupsSetter(v: QueryList<ImpMenuV2ItemGroupDirective>) {
    this.groups.next(v);
  }
  private groups = new ReplaySubject<QueryList<ImpMenuV2ItemGroupDirective>>(1);
  private groupsChanges$: Observable<ImpMenuV2ItemGroupDirective[]> =
    this.groups.pipe(
      first(),
      switchMap((groups) =>
        groups.changes.pipe(
          map(() => groups.toArray()),
          startWith(groups.toArray())
        )
      )
    );
  private groupsFromImperiaTable = defer(() =>
    !!this.imperiaTable
      ? (this.imperiaTable.menuGroupsChanges$ as Observable<
          ImpMenuV2ItemGroupDirective[]
        >)
      : of<ImpMenuV2ItemGroupDirective[]>([])
  );
  private groups$ = combineLatest([
    this.groupsChanges$,
    this.groupsFromImperiaTable,
  ]).pipe(
    map(([groups, groupsFromImperiaTable]) => [
      ...this.itemsAtPosition(groups, 'left'),
      ...this.itemsAtPosition(groupsFromImperiaTable, 'left'),
      ...this.itemsAtPosition(groupsFromImperiaTable, 'center'),
      ...this.itemsAtPosition(groups, 'center'),
      ...this.itemsAtPosition(groupsFromImperiaTable, 'right'),
      ...this.itemsAtPosition(groups, 'right'),
    ]),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion GROUPS

  //#region POSITIONED GROUPS
  public leftGroups$ = this.groups$.pipe(
    map((groups) => this.itemsAtPosition(groups, 'left'))
  );
  public centerGroups$ = this.groups$.pipe(
    map((groups) => this.itemsAtPosition(groups, 'center'))
  );
  public rightGroups$ = this.groups$.pipe(
    map((groups) => this.itemsAtPosition(groups, 'right'))
  );
  //#endregion POSITIONED GROUPS

  //#region GROUPS ITEMS
  private groupsItems$ = this.groups$.pipe(
    switchMap((groups) => combineLatest(groups.map((group) => group.items))),
    map((groupsItems) => groupsItems.flat()),
    map((items) => ({
      items,
      itemsByCollapseOrder: this.getSortedByCollapseOrder(items),
    }))
  );
  //#endregion GROUPS ITEMS

  //#region GROUPS ITEMS DROPDOWN BUTTONS WIDTHS
  @ViewChildren('dropdownButton', {
    read: ElementRef<HTMLElement>,
  })
  set dropdownButtonsSetter(v: QueryList<ElementRef<HTMLElement>>) {
    this.dropdownButtons.next(v);
  }
  private dropdownButtons = new ReplaySubject<
    QueryList<ElementRef<HTMLElement>>
  >(1);
  private dropdownButtonsChanges$: Observable<ElementRef<HTMLElement>[]> =
    this.dropdownButtons.pipe(
      first(),
      switchMap((dropdownButtons) =>
        dropdownButtons.changes.pipe(
          startWith(null),
          map(() => dropdownButtons.toArray())
        )
      )
    );
  private groupsDropdownsButtonsWidthChange$ =
    this.dropdownButtonsChanges$.pipe(
      withLatestFrom(
        this.groups$.pipe(
          switchMap((groups) =>
            combineLatest(
              groups.map((group) => this.groupItemsCollapsedChecks$(group))
            )
          ),
          map((groups) =>
            groups.filter(({ someItemCollapsed }) => someItemCollapsed)
          )
        )
      ),
      filter(
        ([dropdownButtons, groups]) => dropdownButtons.length == groups.length
      ),
      map(([dropdownButtons, groups]) => ({
        dropdownButtons,
        groups,
        itemsByCollapseOrder: this.getSortedByCollapseOrder(
          groups.flatMap(({ items }) => items),
          'asc'
        ),
      })),
      map(({ dropdownButtons, groups, itemsByCollapseOrder }) => ({
        dropdownButtons,
        groups,
        itemsByCollapseOrder,
        lastItemCollapsedIndex:
          itemsByCollapseOrder.findIndex(({ collapsed }) => !collapsed) - 1 < 0
            ? itemsByCollapseOrder.length - 1
            : itemsByCollapseOrder.findIndex(({ collapsed }) => !collapsed) - 1,
      })),
      combineLatestWith(this.menuWidthChange$),
      auditTime(100),
      map(
        ([
          {
            dropdownButtons,
            groups,
            itemsByCollapseOrder,
            lastItemCollapsedIndex,
          },
          { sinceLastChangeIs },
        ]) =>
          dropdownButtons.reduce(
            (totalWidth, b, index) =>
              totalWidth +
              this.widthBasedOnCollapsedInfo(
                b.nativeElement.clientWidth,
                groups[index],
                sinceLastChangeIs,
                lastItemCollapsedIndex > -1
                  ? lastItemCollapsedIndex >
                      Math.max(
                        ...this.indexesAtItemsSortedByCollapseOrder(
                          groups[index].items,
                          itemsByCollapseOrder
                        )
                      )
                  : false,
                lastItemCollapsedIndex > -1
                  ? this.indexesAtItemsSortedByCollapseOrder(
                      groups[index].items,
                      itemsByCollapseOrder
                    ).includes(lastItemCollapsedIndex)
                  : false
              ),
            0
          )
      )
    );
  //#endregion GROUPS ITEMS DROPDOWN BUTTONS WIDTHS

  //#region ITEMS CONTAINERS
  @ViewChildren('itemContainer') set itemsContainersSetter(
    v: QueryList<ElementRef<HTMLDivElement>>
  ) {
    this.itemsContainers.next(v);
  }
  private itemsContainers = new ReplaySubject<
    QueryList<ElementRef<HTMLDivElement>>
  >(1);
  private itemsContainersChanges$: Observable<ElementRef<HTMLDivElement>[]> =
    this.itemsContainers.pipe(
      first(),
      switchMap((itemsContainers) =>
        itemsContainers.changes.pipe(
          startWith(null),
          map(() => itemsContainers.toArray())
        )
      )
    );
  //#endregion ITEMS CONTAINERS

  //#region ITEMS CONTAINERS WIDTH CHANGES
  private itemsContainersWidthChange$ = this.itemsContainersChanges$.pipe(
    switchMap((itemsContainers) =>
      merge(
        ...itemsContainers.map((itemContainer) =>
          this.widthChanges$(itemContainer.nativeElement, 'client')
        )
      ).pipe(map(() => itemsContainers))
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion ITEMS CONTAINERS WIDTH CHANGES

  //#region ITEMS WITH WIDTH AND COLLAPSED
  public items$: Observable<ImpMenuV2ItemDirective[]> = combineLatest([
    this.menuWidthChange$.pipe(map(({ menuWidth }) => menuWidth)),
    this.itemsContainersWidthChange$.pipe(
      combineLatestWith(this.groupsItems$),
      tap(([itemsContainers, { items }]) =>
        items
          .filter(({ collapsed }) => !collapsed)
          .forEach(
            (item, i) =>
              (item.containerWidth =
                itemsContainers[i]?.nativeElement.clientWidth ?? 0)
          )
      ),
      map(([itemsContainers, groupsItems]) => groupsItems)
    ),
    this.groupsDropdownsButtonsWidthChange$,
  ]).pipe(
    auditTime(100),
    tap(
      ([
        menuWidth,
        { items, itemsByCollapseOrder },
        groupsDropdownsButtonsWidth,
      ]) =>
        itemsByCollapseOrder.reduce<number>((totalWidth, item) => {
          totalWidth =
            totalWidth + (item.neverCollapse ? 0 : item.containerWidth);

          item.collapsed = menuWidth < totalWidth && !item.neverCollapse;

          return totalWidth;
        }, groupsDropdownsButtonsWidth + this.neverCollapseItemsWidth(items))
    ),
    map(
      ([
        menuWidth,
        { items, itemsByCollapseOrder },
        groupsDropdownsButtonsWidth,
      ]) => items
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion MENU ITEMS WITH WIDTH AND COLLAPSED

  //#region ITEMS WIDTH CHECKED
  public itemsWidthChecked$ = this.items$.pipe(
    take(1),
    map(() => true),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion ITEMS WIDTH CHECKED

  constructor(
    @Optional() private imperiaTable: ImperiaTableV2Component<any> | null,
    private _ngZone: NgZone,
    public elementRef: ElementRef<HTMLDivElement>
  ) {}

  public itemTrackByFn(index: number, item: ImpMenuV2ItemDirective) {
    return index;
  }

  private getSortedByCollapseOrder(
    items: ImpMenuV2ItemDirective[],
    order: 'asc' | 'desc' = 'desc'
  ) {
    return items.slice().sort((a, b) => {
      if (a.collapseOrder > b.collapseOrder) return order === 'desc' ? -1 : 1;
      if (a.collapseOrder < b.collapseOrder) return order === 'desc' ? 1 : -1;
      return 0;
    });
  }

  private itemsAtPosition(
    groups: ImpMenuV2ItemGroupDirective[],
    position: 'left' | 'center' | 'right'
  ) {
    return groups.filter((group) => group.position === position);
  }

  private groupItemsCollapsedChecks$(group: ImpMenuV2ItemGroupDirective) {
    return zip([
      group.oneItemCollapsed$,
      group.moreThanOneItemCollapsed$,
      group.someItemCollapsed$,
      group.allItemsCollapsed$,
      group.items$,
    ]).pipe(
      map(
        ([
          oneItemCollapsed,
          moreThanOneItemCollapsed,
          someItemCollapsed,
          allItemsCollapsed,
          items,
        ]) => ({
          oneItemCollapsed,
          moreThanOneItemCollapsed,
          someItemCollapsed,
          allItemsCollapsed,
          items,
          separatorsWidth:
            group.collapsedBtnSeparators == 'none'
              ? 0
              : group.collapsedBtnSeparators == 'both'
              ? 34
              : 17,
        })
      )
    );
  }

  private indexesAtItemsSortedByCollapseOrder(
    items: ImpMenuV2ItemDirective[],
    itemsByCollapseOrder: ImpMenuV2ItemDirective[]
  ) {
    return items.reduce<number[]>(
      (indexes, item, index) =>
        itemsByCollapseOrder.includes(item) ? [...indexes, index] : indexes,
      []
    );
  }

  private widthBasedOnCollapsedInfo(
    collapsedButtonWidth: number,
    {
      oneItemCollapsed,
      moreThanOneItemCollapsed,
      allItemsCollapsed,
      separatorsWidth,
    }: {
      oneItemCollapsed: boolean;
      moreThanOneItemCollapsed: boolean;
      allItemsCollapsed: boolean;
      separatorsWidth: number;
    },
    sinceLastChangeIs: 'bigger' | 'smaller',
    lastItemCollapsedIsSuperior: boolean,
    hasLastItemCollapsed: boolean
  ): number {
    if (sinceLastChangeIs == 'smaller') return collapsedButtonWidth;

    //this case bugs at initial load thats why it is commented,
    //before load if there is one item collapsed, button will removed if the item can fit without the button
    /* if (
      hasLastItemCollapsed && //has last item collapsed
      oneItemCollapsed
    ) {
      return 0;
    } */

    if (
      hasLastItemCollapsed && //has last item collapsed
      allItemsCollapsed // all items collapsed
    ) {
      return collapsedButtonWidth;
    }

    if (
      hasLastItemCollapsed && //has last item collapsed
      moreThanOneItemCollapsed && //more than one item collapsed
      !allItemsCollapsed
    ) {
      return 38 + separatorsWidth;
    }

    if (!hasLastItemCollapsed && lastItemCollapsedIsSuperior) {
      return collapsedButtonWidth;
    }

    return collapsedButtonWidth;
  }

  private widthChanges$(
    element: HTMLElement,
    width: 'client' | 'offset'
  ): Observable<number> {
    return new Observable<number>((subscriber) => {
      const resizeObserver = new ResizeObserver(([entry]) =>
        this._ngZone.run(() =>
          subscriber.next(
            width === 'client' ? entry.contentRect.width : element.offsetWidth
          )
        )
      );
      resizeObserver.observe(element);
      return function unsubscribe() {
        resizeObserver.unobserve(element);
      };
    }).pipe(distinctUntilChanged());
  }

  private neverCollapseItemsWidth(items: ImpMenuV2ItemDirective[]) {
    return items
      .filter(({ neverCollapse }) => neverCollapse)
      .reduce((totalWidth, item) => totalWidth + item.containerWidth, 0);
  }
}
