import {
  ChangeDetectionStrategy,
  Component,
  input,
  Output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { map, Observable, ReplaySubject, share, shareReplay } from 'rxjs';
import { IMPERIA_TABLE_V3_PAGINATION_PROVIDER } from '../../models/imperia-table-v3-pagination-provider';
import { ImperiaTablePagination } from '../../models/imperia-table-v3-pagination.models';
import { PaginationValue } from '@imperiascm/scp-utils/payload';

@Component({
  selector:
    'imperia-table-v3-manual-pagination, imperia-table-v3-manuel-pagination',
  providers: [
    {
      provide: IMPERIA_TABLE_V3_PAGINATION_PROVIDER,
      useExisting: ImperiaTableV3ManualPaginationComponent,
    },
  ],
  templateUrl: './imperia-table-v3-manual-pagination.component.html',
  styleUrl: './imperia-table-v3-manual-pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV3ManualPaginationComponent
  implements ImperiaTablePagination
{
  //#region ROW BUTTON TEMPLATE
  public $buttonRowTemplate =
    viewChild.required<TemplateRef<any>>('paginationBtnRow');
  //#endregion ROW BUTTON TEMPLATE

  //#region PAGE
  $page = input.required<number>({ alias: 'page' });
  //#endregion PAGE

  //#region SIZE
  $size = input.required<number>({ alias: 'size' });
  //#endregion SIZE

  //#region TRIGGER
  trigger = new ReplaySubject<void>(1);
  //#endregion TRIGGER

  //#region VALUE
  value$: Observable<PaginationValue> = this.trigger.pipe(
    map(() => ({ Page: this.$page() + 1, Size: this.$size() })),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion VALUE

  //#region VALUE CHANGE
  @Output('valueChange') public valueChange$ = this.value$.pipe(share());
  //#endregion VALUE CHANGE
}
