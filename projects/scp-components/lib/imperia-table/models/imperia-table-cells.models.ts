import { ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ImperiaTableCellEditRequestState, ImperiaTableCellTemplateContext, TImperiaTableCellStyle } from './imperia-table-cells.types';
import { ImperiaTableColumnDataInfoFormValidations, TImperiaTableColumnDataInfoType, TImperiaTableColumnDataInfoTypes, TImperiaTableColumnField } from './imperia-table-columns.types';
import { ImperiaTableRow } from './imperia-table-rows.models';
import {
  BehaviorSubject,
  Observable,
  Subject,
  animationFrameScheduler,
  delay,
  filter,
  map,
  merge,
  shareReplay,
  startWith,
  tap,
} from 'rxjs';

export class ImperiaTableCell<
  TItem extends object,
  TField extends
    TImperiaTableColumnField<TItem> = TImperiaTableColumnField<TItem>,
  TDataInfoType extends
    TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes,
> {
  dataInfo: TImperiaTableColumnDataInfoType<TDataInfoType>;
  class: string;
  control: FormControl<TItem[TField] | null>;
  /**
   * @description: This property is used to store the reference to the cell element.
   * can be null because the cell element is not created until the cell is rendered.
   */
  elementRef: ElementRef<HTMLDivElement> | null = null;

  public rowspan: number | null = null;

  private _state: Subject<{
    state: ImperiaTableCellEditRequestState;
    row: ImperiaTableRow<TItem>;
  }> = new Subject<{
    state: ImperiaTableCellEditRequestState;
    row: ImperiaTableRow<TItem>;
  }>();

  public setState: (
    state: ImperiaTableCellEditRequestState,
    row: ImperiaTableRow<TItem>,
  ) => void = (
    state: ImperiaTableCellEditRequestState,
    row: ImperiaTableRow<TItem>,
  ) => {
    this._state.next({ state, row });
  };

  public state$: Observable<ImperiaTableCellEditRequestState> = merge(
    this._state.pipe(
      tap(({ state, row }) => {
        if (state.ok === true) {
          Object.assign(row.data, {
            [this.field]: this.control.value,
          });
          this.control.markAsPristine();
        } else if (state.canceled === true) {
          this.control.setValue(row.data[this.field]);
        }
      }),
      map(({ state }) => state),
    ),
    this._state.pipe(
      filter(({ state }) => state.ok === true),
      delay(2000, animationFrameScheduler),
      map(() => ({ loading: false })),
    ),
  ).pipe(
    startWith({ loading: false }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  /**
   * @deprecated
   */
  private _loading = new BehaviorSubject<boolean>(false);
  /**
   * @deprecated
   */
  public loading$ = this._loading.asObservable();

  constructor(
    public field: TField,
    public value: TItem[TField] | null,
    public templateContext: ImperiaTableCellTemplateContext<TItem>,
    dataInfo: TImperiaTableColumnDataInfoType<TDataInfoType>,
    controlValidations: ImperiaTableColumnDataInfoFormValidations,
    klass: string = '',
    public style: TImperiaTableCellStyle = {},
  ) {
    this.dataInfo = { ...dataInfo };
    this.class = klass ?? '';
    this.control = new FormControl<TItem[TField] | null>(
      value,
      controlValidations,
    );
  }
}
