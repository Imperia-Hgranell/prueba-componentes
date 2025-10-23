import { DataSource } from '@angular/cdk/collections';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ImperiaTableRow } from './imperia-table-rows.models';
import { BehaviorSubject, Observable, combineLatest, map, tap } from 'rxjs';

export class ImpTableDataSource<TItem extends object> extends DataSource<
  ImperiaTableRow<TItem>
> {
  public dataStream: BehaviorSubject<ImperiaTableRow<TItem>[]>;
  private viewport: CdkVirtualScrollViewport;
  constructor(
    data: ImperiaTableRow<TItem>[],
    viewport: CdkVirtualScrollViewport,
  ) {
    super();
    this.dataStream = new BehaviorSubject<ImperiaTableRow<TItem>[]>(data);
    this.viewport = viewport;
    this.viewport.attach(this as any);
  }

  connect(): Observable<readonly ImperiaTableRow<TItem>[]> {
    return combineLatest([
      this.dataStream.pipe(tap((a) => console.log(a))),
      this.viewport.renderedRangeStream.pipe(tap((a) => console.log(a))),
    ]).pipe(map(([data, { start, end }]) => data.slice(start, end)));
  }

  disconnect(): void {
    this.dataStream.complete();
  }

  updateRows(data: ImperiaTableRow<TItem>[]) {
    this.dataStream.next(data);
  }
}
