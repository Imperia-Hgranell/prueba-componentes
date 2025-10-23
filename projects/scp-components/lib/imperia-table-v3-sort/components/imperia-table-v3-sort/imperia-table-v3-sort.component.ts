import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { withValueFrom } from '@imperiascm/rxjs-utils';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  merge,
  ReplaySubject,
  share,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { ImperiaTableV3SortTemplateDirective } from '../../template-directives/imperia-table-v3-sort-template.directive';
import { ImperiaTableColumn } from '../../../imperia-table/models/imperia-table-columns.models';
import { ImperiaTableV2Component } from '../../../imperia-table/components/imperia-table-v2/imperia-table-v2.component';
import {
  DEFAULT_ORDER,
  OrderEqual,
  OrderValue,
  Sort,
} from '@imperiascm/scp-utils/payload';

@Component({
  selector: 'imperia-table-v3-sort',
  templateUrl: './imperia-table-v3-sort.component.html',
  styleUrls: ['./imperia-table-v3-sort.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV3SortComponent<TItem extends object> {
  //#region TEMPLATES
  @ViewChildren(ImperiaTableV3SortTemplateDirective) set templatesSetter(
    v: QueryList<ImperiaTableV3SortTemplateDirective<TItem>>
  ) {
    this.templates.next(v);
  }
  private templates = new ReplaySubject<
    QueryList<ImperiaTableV3SortTemplateDirective<TItem>>
  >(1);
  private templates$ = this.templates.pipe(
    switchMap((query) =>
      query.changes.pipe(
        map(() => query.toArray()),
        startWith(query.toArray())
      )
    )
  );

  public buttonsTemplate$ = this.templates$.pipe(
    map(
      (templates) =>
        templates.find(({ slot }) => slot === 'buttons')?.template ?? null
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public iconsTemplate$ = this.templates$.pipe(
    map(
      (templates) =>
        templates.find(({ slot }) => slot === 'icons')?.template ?? null
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion TEMPLATES

  //#region SORT
  public sortASC = new Subject<ImperiaTableColumn<TItem>>();
  public sortDESC = new Subject<ImperiaTableColumn<TItem>>();
  public onSort$ = merge(
    this.sortASC.pipe(map((col) => ({ col, direction: Sort.ASC }))),
    this.sortDESC.pipe(map((col) => ({ col, direction: Sort.DESC })))
  ).pipe(
    switchMap(({ col, direction }) =>
      combineLatest([col.isSorted$, col.sort$]).pipe(
        take(1),
        map(([isSorted, currentSort]) => ({
          isSorted,
          currentSort,
          col,
          direction,
        }))
      )
    ),
    withValueFrom(this.table.columns$),
    map(([{ isSorted, col, direction, currentSort }, columns]) => {
      columns.forEach((column) => column.sort(Sort.NONE));
      if (!isSorted) {
        col.sort(direction);
        return { Column: col.filterName, Sort: direction };
      } else if (currentSort === direction) {
        col.sort(Sort.NONE);
        return DEFAULT_ORDER;
      } else {
        col.sort(direction);
        return { Column: col.filterName, Sort: direction };
      }
    }),
    share()
  );
  //#endregion SORT

  //#region VALUE
  @Input('value') public set valueSetter(v: OrderValue | null) {
    this._value.next(v ?? DEFAULT_ORDER);
  }
  private _value = new ReplaySubject<OrderValue>(1);
  private _valueChange = this._value.pipe(
    withValueFrom(this.table.columns$),
    tap(([OrderValue, columns]) => {
      columns.forEach((column) => column.sort(Sort.NONE));
      const col = columns.find(
        (column) => column.filterName === OrderValue.Column
      );
      col?.sort(OrderValue.Sort);
    }),
    map(([OrderValue]) => OrderValue),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public value$ = merge(this._valueChange, this.onSort$).pipe(
    distinctUntilChanged(OrderEqual),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  @Output('valueChange') public valueChange$ = this.value$.pipe(share());
  //#endregion VALUE

  constructor(private table: ImperiaTableV2Component<TItem>) {}
}
