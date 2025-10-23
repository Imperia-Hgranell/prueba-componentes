import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
} from '@angular/core';
import { CancelDeletionParams, ImperiaTableV2DeletionEvent, ResultDeletionParams } from './models';
import { ImperiaTableV2Component } from '../imperia-table-v2/imperia-table-v2.component';
import { ImpTranslateService } from '@imperiascm/translate';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  map,
  race,
  switchMap,
  take,
  tap,
} from 'rxjs';

import { modal, httpRequest } from '@imperiascm/rxjs-utils';

@Component({
  selector: 'imperia-table-v2-deletion',
  templateUrl: './imperia-table-v2-deletion.component.html',
  styleUrls: ['./imperia-table-v2-deletion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV2DeletionComponent<TItem extends object> {
  public readonly translation =
    this.typedTranslateService.translation.IMPERIA_TABLE_V2_DELETION;

  //#region INPUTS
  @Input() withConfirmation: boolean = true;
  @Input() confirmationMessage: string | null = null;
  //#endregion INPUTS

  //#region DISABLED
  @Input('disabled') set disabledSetter(v: boolean | null) {
    if (v === null) return;
    this.disabled.next(v);
  }
  private disabled = new BehaviorSubject<boolean>(false);
  public disabled$ = combineLatest([
    this.disabled,
    this.table.rowSelection$,
  ]).pipe(map(([disabled, selection]) => disabled || !selection.length));
  //#endregion DISABLED

  private _delete = new Subject<void>();

  public result = new Subject<{
    result: boolean;
    params?: ResultDeletionParams;
  }>();

  public _cancel = new Subject<CancelDeletionParams | undefined>();

  public readonly modal = modal({
    opened: () => ({ visible: true }),
    closed: () => ({ visible: false }),
  });

  public on = new Subject<void>();
  public readonly onDelete$ = httpRequest({
    on: this._delete,
    validateOn: () => true, // optional
    request: ({ cancel }) =>
      race(
        this.result,
        this._cancel.pipe(
          tap(() => cancel()),
          map((params) => ({ result: null, params }))
        )
      ),
    validateRequest: ({ result }) => result,
  });

  public loading$ = this.onDelete$.state$.pipe(map((state) => state.loading));

  @Output('onDelete') delete$: Observable<ImperiaTableV2DeletionEvent<TItem>> =
    this._delete.pipe(
      switchMap(() => this.table.rowSelection$.pipe(take(1))),
      map((selection) => ({
        selection,
        result: (result: boolean, params?: ResultDeletionParams) => {
          setTimeout(() => this.result.next({ result, params }));
        },
        cancel: (params?: CancelDeletionParams) => {
          setTimeout(() => this._cancel.next(params));
        },
      }))
    );

  constructor(
    private typedTranslateService: ImpTranslateService,
    private table: ImperiaTableV2Component<TItem>
  ) {}

  public delete() {
    this.withConfirmation ? this.modal.open() : this._delete.next();
  }

  public accept() {
    this._delete.next();
  }

  public cancel() {
    this.modal.close();
  }
}
