import {
  ChangeDetectionStrategy,
  Component,
  input,
  Output,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  combineLatest,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  merge,
  Observable,
  share,
  shareReplay,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';
import { IMPERIA_TABLE_V3_PAGINATION_PROVIDER } from '../../models/imperia-table-v3-pagination-provider';
import { ImperiaTablePagination } from '../../models/imperia-table-v3-pagination.models';
import { PaginationValue } from '@imperiascm/scp-utils/payload';
import { ImperiaTableV2Component } from '../../../imperia-table/components/imperia-table-v2/imperia-table-v2.component';

@Component({
  selector: 'imperia-table-v3-pagination',
  templateUrl: './imperia-table-v3-pagination.component.html',
  styleUrls: ['./imperia-table-v3-pagination.component.scss'],
  providers: [
    {
      provide: IMPERIA_TABLE_V3_PAGINATION_PROVIDER,
      useExisting: ImperiaTableV3PaginationComponent,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})

/**
 * Approach used:
 * 1. Use the `renderedRangeStream` from the table's viewport to get the last index rendered.
 * 2. Check if the last index rendered is greater than 0 and if it is a multiple of the current page size.
 * 3. If both conditions are met, increment the page number by 1.
 * This is done to ensure that pagination is triggered only when new data is rendered.
 *
 *
 * EDGE CASE!!: When there are 200 items and a filter is applied, the cdk-virtual-scroll-viewport is not redimesioned instantly,
 * it lasts a few miliseconds more than the loading emits false, so if the scroll is on bottom and a filter is applied,
 * the table will paginate the next page.
 */
export class ImperiaTableV3PaginationComponent
  implements ImperiaTablePagination
{
  isManual: boolean = false;
  $size = input.required<number>({ alias: 'size' });
  private size$ = toObservable(this.$size).pipe(distinctUntilChanged());

  $page = input.required<number>({ alias: 'page' });
  private page$ = toObservable(this.$page).pipe(distinctUntilChanged());

  //#region PAGINATION TRIGGER
  public paginationTrigger$ = this.table.viewport$.pipe(
    switchMap((viewport) =>
      viewport.renderedRangeStream.pipe(map((range) => range.end))
    ),
    map((lastIndexRendered) => lastIndexRendered),
    withLatestFrom(this.table.rows$),
    filter(
      ([lastIndexRendered, value]) =>
        lastIndexRendered === value.filter(({ visible }) => visible).length &&
        value.length >= this.$page() * this.$size()
    ),
    map(() => ({
      Page: this.$page() + 1,
      Size: this.$size(),
    })),
    filter(({ Page }) => Number.isInteger(Page)),
    exhaustMap((Pagination) =>
      this.table.loading$.pipe(
        take(1),
        map(({ state }) => ({ Pagination, state }))
      )
    ),
    filter(({ state }) => !state),
    map(({ Pagination }) => Pagination),
    shareReplay({ bufferSize: 1, refCount: true })
  ) as Observable<PaginationValue>;
  //#endregion PAGINATION TRIGGER

  //#region VALUE
  public value$: Observable<PaginationValue> = merge(
    combineLatest([this.page$, this.size$]).pipe(
      map(([Page, Size]) => ({ Page, Size }))
    ),
    this.paginationTrigger$
  );
  @Output('valueChange') public valueChange$ = this.value$.pipe(share());
  //#endregion VALUE

  constructor(private table: ImperiaTableV2Component<any>) {}
}
