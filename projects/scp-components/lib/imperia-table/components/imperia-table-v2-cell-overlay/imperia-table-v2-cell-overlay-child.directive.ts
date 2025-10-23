import { Directive, inject } from '@angular/core';
import { ImperiaTableV2CellOverlayComponent } from './imperia-table-v2-cell-overlay.component';
import { ImpTranslateService } from '@imperiascm/translate';
import { shareReplay, take } from 'rxjs';

@Directive()
export class ImperiaTableV2CellOverlayChild<TItem extends object> {
  protected cellOverlay = inject(ImperiaTableV2CellOverlayComponent<TItem>);
  protected typedTranslateService = inject(ImpTranslateService);

  public clickEvent$ = this.cellOverlay.onOpen$.pipe(
    take(1),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}
