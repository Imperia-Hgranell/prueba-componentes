import { moveItemInArray } from '@angular/cdk/drag-drop';
import { Directive, Host, Inject, Output } from '@angular/core';
import { map, shareReplay, switchMap, take } from 'rxjs';
import {
  IMPERIA_TABLE_V2_HOST,
  ImperiaTableV2Host,
} from '../../shared/template-apis/imperia-table.tokens';

@Directive({
  selector: 'imperia-table-v2-reorder',
  standalone: false,
})
export class ImperiaTableV2ReorderDirective<TItem extends object> {
  //#section REORDERED ROWS
  public reorderedRows$ = this.table.onRowReorder.pipe(
    switchMap((event) =>
      this.table.rows$.pipe(
        take(1),
        map((rows) => {
          const prevIndex = rows.findIndex(
            (row) =>
              this.table.dataKeyValue(row.data) ===
              this.table.dataKeyValue(event.item.data.data)
          );
          const currentIndex =
            prevIndex +
            Math.round(
              (event.distance.y + (event.distance.y < 0 ? -5 : 5)) /
                event.item.element.nativeElement.offsetHeight
            );
          const containerDataLength = event.container.data.length;
          const finalCurrentIndex =
            currentIndex >= containerDataLength
              ? containerDataLength - 1
              : currentIndex <= 0
              ? 0
              : currentIndex;
          moveItemInArray(rows, prevIndex, finalCurrentIndex);
          return [...rows];
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endsection REORDERED ROWS

  //#section OUTPUTS
  @Output() onRowReorder = this.reorderedRows$;
  //#endsection OUTPUTS

  constructor(
    @Host()
    @Inject(IMPERIA_TABLE_V2_HOST)
    private table: ImperiaTableV2Host<TItem>
  ) {}
}
