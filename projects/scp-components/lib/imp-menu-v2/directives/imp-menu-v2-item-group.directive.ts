import {
  ContentChildren,
  Directive,
  ElementRef,
  Host,
  Input,
  Optional,
  QueryList,
  SkipSelf,
} from '@angular/core';
import { ImpMenuV2Component } from '../components/imp-menu-v2/imp-menu-v2.component';
import { ImpMenuV2ItemDirective } from './imp-menu-v2-item.directive';
import { ImpMenuV2ItemPositions, ImpMenuV2SeparatorPositions } from '../models/imp-menu-v2.models';
import { ICONS_NAMES } from '../../imperia-icon-button/imperia-icon-button.component';
import { ImperiaTableV2Component } from '../../imperia-table/components/imperia-table-v2/imperia-table-v2.component';
import { isElementClickedOverlappingParentElement } from '@imperiascm/scp-utils/functions';
import {
  EMPTY,
  Observable,
  ReplaySubject,
  Subject,
  animationFrameScheduler,
  combineLatest,
  defer,
  delay,
  fromEvent,
  map,
  merge,
  shareReplay,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';

@Directive({
  selector: 'imp-menu-v2-item-group',
})
export class ImpMenuV2ItemGroupDirective {
  @Input() position: ImpMenuV2ItemPositions = 'left';
  @Input() collapsedBtnText: string = '';
  @Input() collapsedBtnIcon: ICONS_NAMES = 'chevron-down';
  @Input() collapsedBtnIconPosition: 'left' | 'right' = 'left';
  @Input() set collapsedBtnSeparatorsSetter(
    v: ImpMenuV2SeparatorPositions | ''
  ) {
    this._collapsedBtnSeparators = v;
  }
  private _collapsedBtnSeparators: ImpMenuV2SeparatorPositions | '' = '';
  public get collapsedBtnSeparators(): ImpMenuV2SeparatorPositions | '' {
    return (
      this._collapsedBtnSeparators ||
      (this.position === 'left'
        ? 'after'
        : this.position == 'center'
        ? 'both'
        : 'before')
    );
  }

  @ContentChildren(ImpMenuV2ItemDirective, { descendants: true })
  set itemsSetter(v: QueryList<ImpMenuV2ItemDirective>) {
    this.items.next(v.toArray());
  }
  public items = new ReplaySubject<ImpMenuV2ItemDirective[]>(1);

  public items$ = defer(() => {
    if (this.menu) {
      return merge(this.items, this.menu.items$);
    } else if (this.imperiaTable) {
      return merge(
        this.items,
        this.imperiaTable.captionMenu$.pipe(
          take(1),
          switchMap((captionMenu) => captionMenu?.items$ ?? EMPTY)
        )
      );
    }
    return this.items;
  }).pipe(
    map((items) => items.filter((item) => item.group === this)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public visibleItems$ = this.items$.pipe(
    map((items) => items.filter((item) => !item.collapsed)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public someItemVisible$ = this.visibleItems$.pipe(
    map((items) => items.length > 0),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public collapsedItems$ = this.items$.pipe(
    map((items) => items.filter((item) => item.collapsed)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public oneItemCollapsed$ = this.collapsedItems$.pipe(
    map((items) => items.length == 1),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public moreThanOneItemCollapsed$ = this.collapsedItems$.pipe(
    map((items) => items.length > 1),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public someItemCollapsed$ = this.collapsedItems$.pipe(
    map((items) => items.length > 0),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public allItemsCollapsed$ = combineLatest([
    this.items,
    this.collapsedItems$,
  ]).pipe(
    map(([items, collapsedItems]) => items.length == collapsedItems.length),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  //#region CLICK
  click$ = fromEvent<MouseEvent>(document.body, 'click').pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion CLICK

  //#region COLLAPSED ITEMS DROPDOWN VISIBILITY
  public toggleCollapsedItemsDropdown = new Subject<{
    groupContainer: HTMLDivElement;
    dropdown: HTMLDivElement;
  }>();
  private toggleCollapsedItemsDropdown$: Observable<boolean> =
    this.toggleCollapsedItemsDropdown.pipe(
      switchMap(({ dropdown }) =>
        this.collapsedItemsDropdownVisibility$.pipe(
          tap((currentState) =>
            setTimeout(() => !currentState && dropdown.focus())
          ),
          map((currentState) => !currentState),
          take(1)
        )
      )
    );

  public collapsedItemsDropdownFocusChange = new Subject<string | null>();
  public collapsedItemsDropdownVisibility$: Observable<boolean> = merge(
    this.someItemCollapsed$.pipe(
      map((someItemCollapsed) => !someItemCollapsed),
      map(() => false)
    ),
    this.toggleCollapsedItemsDropdown$,
    this.collapsedItemsDropdownFocusChange.pipe(
      withLatestFrom(this.toggleCollapsedItemsDropdown),
      map(([focused, { dropdown }]) => {
        return { focused, dropdown };
      }),
      switchMap(({ focused, dropdown }) =>
        this.click$.pipe(
          take(1),
          map((event) => ({ focused, dropdown, event }))
        )
      ),
      map(({ focused, dropdown, event }) => {
        const dropdownVisible = Array.from(dropdown.classList).includes(
          'visible'
        );
        if (!dropdownVisible) return false;
        if (focused || dropdown.contains(event.target as Node)) {
          dropdown.focus();
          return true;
        }

        const hasBeenClickedAbove = isElementClickedOverlappingParentElement(
          event,
          dropdown,
          true
        );
        //note: retrive focus to the dropdownCollapseditems
        setTimeout(() => hasBeenClickedAbove && dropdown.focus());
        return hasBeenClickedAbove;
      })
    )
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion COLLAPSED ITEMS DROPDOWN VISIBILITY

  //#region COLLAPSED ITEMS DROPDOWN POSITION
  public collapsedItemsDropdownPosition$ =
    this.toggleCollapsedItemsDropdown.pipe(
      delay(0, animationFrameScheduler),
      map(({ dropdown, groupContainer }) => {
        const { width } = dropdown.getBoundingClientRect();
        const { left, right } = groupContainer.getBoundingClientRect();
        const menu = this.container.nativeElement.getBoundingClientRect();

        if (left + width > menu.right) {
          return 'right';
        } else if (right - width < menu.left) {
          return 'left';
        } else {
          return 'right';
        }
      })
    );
  //#endregion COLLAPSED ITEMS DROPDOWN POSITION

  constructor(
    @Host() @Optional() private menu: ImpMenuV2Component | null,
    @Host()
    @Optional()
    private imperiaTable: ImperiaTableV2Component<any> | null,
    @SkipSelf() private container: ElementRef<HTMLDivElement>
  ) {}
}
