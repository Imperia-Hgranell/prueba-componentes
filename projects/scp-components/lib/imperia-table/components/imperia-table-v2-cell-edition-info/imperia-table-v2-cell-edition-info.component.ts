import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ImperiaTableV2CellOverlayChild } from '../imperia-table-v2-cell-overlay/imperia-table-v2-cell-overlay-child.directive';
import { ImperiaTableV2ClickEvent } from '../../directives/imperia-table-v2-clicks.directive';
import {
  Observable,
  filter,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs';

export interface IEditionInfoRow {
  UpdateUser: string;
  UpdatedDate: string | null;
}

export class EditionInfoRow {
  UpdateUser: string;
  UpdatedDate: Date | null;

  constructor(updateUser: string, updatedDate: Date | string | null) {
    this.UpdateUser = updateUser;
    this.UpdatedDate =
      typeof updatedDate === 'string' ? new Date(updatedDate) : updatedDate;
  }
}

@Component({
  selector: 'imperia-table-v2-cell-edition-info',
  templateUrl: './imperia-table-v2-cell-edition-info.component.html',
  styleUrls: ['./imperia-table-v2-cell-edition-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV2CellEditionInfoComponent<
  TItem extends object,
> extends ImperiaTableV2CellOverlayChild<TItem> {
  public readonly TRANSLATION =
    this.typedTranslateService.translation.IMPERIA_TABLE_V2_CELL_EDITION_INFO;

  @Input('getInfoFn') getInfoFn: (
    event: ImperiaTableV2ClickEvent<TItem>,
  ) => Observable<IEditionInfoRow[]> = () =>
    of([]) as Observable<IEditionInfoRow[]>;

  public info$ = this.cellOverlay.onOpen$.pipe(
    take(1),
    switchMap((event) =>
      merge(
        this.cellOverlay.onCellValueRestored$,
        this.cellOverlay.onCellForecastConceptDeleted$,
      ).pipe(
        filter(({ clickEvent }) => clickEvent === event),
        map(() => event),
        startWith(event),
      ),
    ),
    switchMap((event) =>
      this.getInfoFn(event).pipe(
        map((data) =>
          data.map(
            ({ UpdateUser, UpdatedDate }) =>
              new EditionInfoRow(UpdateUser, UpdatedDate),
          ),
        ),
        map((data) =>
          data.sort(
            (a, b) =>
              (b.UpdatedDate?.getTime() ?? 0) - (a.UpdatedDate?.getTime() ?? 0),
          ),
        ),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  public height$ = this.info$.pipe(
    map((info) => Math.max(Math.min(info.length * 34, 3 * 34), 34) + 31),
    startWith(34 + 31),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  public loading$ = merge(
    this.cellOverlay.onOpen$.pipe(
      take(1),
      map(() => true),
    ),
    this.info$.pipe(map(() => false)),
  ).pipe(startWith(false), shareReplay({ bufferSize: 1, refCount: true }));
}
