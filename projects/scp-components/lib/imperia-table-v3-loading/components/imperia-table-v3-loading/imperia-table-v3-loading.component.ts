import {
  ChangeDetectionStrategy,
  Component,
  Input,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  FiltersEqual,
  WithoutInvalidFilters,
} from '@imperiascm/scp-utils/payload';
import {
  distinctUntilChanged,
  map,
  merge,
  NEVER,
  ReplaySubject,
  share,
  shareReplay,
  skip,
  startWith,
  switchMap,
} from 'rxjs';
import { HORIZONTAL_ELEMENT_ENTER_LEAVE } from '../../../imperia-table/components/imperia-table-filter-v2/imperia-table-filter-v2.animations';
import { ImperiaTableLoading } from '../../../imperia-table/models/imperia-table-loading.models';
import { ImperiaTableV3Component } from '../../../imperia-table-v3/components/imperia-table-v3/imperia-table-v3.component';
import { ImperiaTableV3LoadingTemplateDirective } from '../../template-directives/imperia-table-v3-loading-template.directive';

@Component({
  selector: 'imperia-table-v3-loading',
  templateUrl: './imperia-table-v3-loading.component.html',
  styleUrls: ['./imperia-table-v3-loading.component.scss'],
  animations: [HORIZONTAL_ELEMENT_ENTER_LEAVE],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV3LoadingComponent {
  //#region TEMPLATES
  @ViewChildren(ImperiaTableV3LoadingTemplateDirective) set templatesSetter(
    v: QueryList<ImperiaTableV3LoadingTemplateDirective>
  ) {
    this.templates.next(v);
  }
  private templates = new ReplaySubject<
    QueryList<ImperiaTableV3LoadingTemplateDirective>
  >(1);
  private templates$ = this.templates.pipe(
    switchMap((query) =>
      query.changes.pipe(
        map(() => query.toArray()),
        startWith(query.toArray())
      )
    )
  );
  public topTemplate$ = this.templates$.pipe(
    map(
      (templates) =>
        templates.find(({ slot }) => slot === 'top')?.template ?? null
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public bottomTemplate$ = this.templates$.pipe(
    map(
      (templates) =>
        templates.find(({ slot }) => slot === 'bottom')?.template ?? null
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion TEMPLATES

  @Input('value') set valueSetter(v: ImperiaTableLoading | null) {
    if (!v) return;
    this.value.next(v);
  }
  private value = new ReplaySubject<ImperiaTableLoading>(1);

  private searchChange$ = this.table.imperiaTableV3SearchComponent$.pipe(
    switchMap((search) => search?.valueChange$ ?? NEVER),
    map(() => new ImperiaTableLoading({ state: true, from: 'searchChanges' })),
    share()
  );

  private sortChange$ = this.table.imperiaTableV3SortComponent$.pipe(
    switchMap((sort) => sort?.valueChange$ ?? NEVER),
    map(
      () => new ImperiaTableLoading({ state: true, from: 'columnSortChanges' })
    ),
    share()
  );

  private paginationChange$ =
    this.table.imperiaTableV3PaginationComponent$.pipe(
      switchMap((pagination) => pagination?.valueChange$ ?? NEVER),
      map(
        () =>
          new ImperiaTableLoading({
            state: true,
            from: 'pageChanges',
            at: 'bottom',
          })
      ),
      share()
    );

  private filtersChange$ = this.table.imperiaTableV3FiltersComponent$.pipe(
    switchMap((filters) => filters?.valueChange$ ?? NEVER),
    map(WithoutInvalidFilters),
    distinctUntilChanged(FiltersEqual),
    map(() => new ImperiaTableLoading({ state: true, from: 'filtersChanges' })),
    share()
  );

  public value$ = merge(
    this.value,
    this.searchChange$.pipe(skip(1)),
    this.sortChange$.pipe(skip(1)),
    this.paginationChange$.pipe(skip(1)),
    this.filtersChange$.pipe(skip(1))
  ).pipe(
    startWith(new ImperiaTableLoading(false)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(public table: ImperiaTableV3Component<any>) {}
}
