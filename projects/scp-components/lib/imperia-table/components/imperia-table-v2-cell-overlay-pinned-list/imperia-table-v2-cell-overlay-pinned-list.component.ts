import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { COMPONENT_OPEN_CLOSE, HORIZONTAL_LIST_ELEMENT_ENTER_LEAVE } from '../imperia-table-filter-v2/imperia-table-filter-v2.animations';
import { ImperiaTableCellOverlayContext } from '../imperia-table-v2-cell-overlay/imperia-table-v2-cell-overlay.component';
import { ImperiaTableV2Component } from '../imperia-table-v2/imperia-table-v2.component';
import {
  EMPTY,
  Observable,
  ReplaySubject,
  Subject,
  first,
  map,
  merge,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs';

@Component({
  selector: 'imperia-table-v2-cell-overlay-pinned-list',
  templateUrl: './imperia-table-v2-cell-overlay-pinned-list.component.html',
  styleUrls: ['./imperia-table-v2-cell-overlay-pinned-list.component.scss'],
  animations: [COMPONENT_OPEN_CLOSE, HORIZONTAL_LIST_ELEMENT_ENTER_LEAVE],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV2CellOverlayPinnedListComponent<
  TItem extends object
> {
  //#region PIN
  public cellOverlayComponent$ = this.table.cellOverlayComponent$;
  private onPinCellOverlay$ = this.cellOverlayComponent$.pipe(
    switchMap((cellOverlay) => cellOverlay?.onPin$ ?? EMPTY)
  );
  //#endregion PIN

  //#region UNPIN
  public unpin = new Subject<
    ImperiaTableCellOverlayContext<TItem>['$implicit']
  >();
  private onUnpinCellOverlay$ = this.unpin.asObservable();
  //#endregion UNPIN

  //#region PINNED
  public cellOverlaysPinned$: Observable<
    ImperiaTableCellOverlayContext<TItem>['$implicit'][]
  > = merge(
    this.onPinCellOverlay$.pipe(
      switchMap((cellOverlay) =>
        this.cellOverlaysPinned$.pipe(
          take(1),
          map((cellOverlays) => [...cellOverlays, cellOverlay])
        )
      )
    ),
    this.onUnpinCellOverlay$.pipe(
      switchMap((cellOverlay) =>
        this.cellOverlaysPinned$.pipe(
          take(1),
          map((cellOverlays) =>
            cellOverlays.filter((e) => e.event !== cellOverlay.event)
          )
        )
      )
    )
  ).pipe(startWith([]), shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion PINNED

  @ViewChildren('cellOverlayPinnedContainer')
  set cellOverlayPinnedContainersSetter(
    v: QueryList<ElementRef<HTMLDivElement>>
  ) {
    this.cellOverlayPinnedContainers.next(v);
  }
  private cellOverlayPinnedContainers = new ReplaySubject<
    QueryList<ElementRef<HTMLDivElement>>
  >(1);
  private cellOverlayPinnedContainers$ = this.cellOverlayPinnedContainers.pipe(
    first(),
    switchMap((containers) =>
      containers.changes.pipe(
        map(() => containers.toArray()),
        startWith(containers.toArray()),
        map((containers) =>
          containers.map((container) => container.nativeElement)
        )
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public cellOverlayPinnedContainerWidth$ =
    this.cellOverlayPinnedContainers$.pipe(
      map((containers) =>
        containers.length
          ? Math.max(...containers.map((container) => container.clientWidth))
          : null
      ),
      shareReplay({
        bufferSize: 1,
        refCount: true,
      })
    );

  constructor(protected table: ImperiaTableV2Component<TItem>) {}
}
