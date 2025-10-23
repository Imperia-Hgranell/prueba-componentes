import { Clipboard } from '@angular/cdk/clipboard';
import { Directive, Input, inject } from '@angular/core';
import { ImperiaTableV2Component } from '../imperia-table-v2/imperia-table-v2.component';
import { ImperiaTableColumn } from '../../models/imperia-table-columns.models';
import { ImperiaTableRow } from '../../models/imperia-table-rows.models';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  share,
  shareReplay,
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';

@Directive({
  selector: 'imperia-table-v2-base-selection',
    standalone: false
})
export class ImperiaTableV2BaseSelectionDirective<TItem extends object> {
  public readonly table = inject(ImperiaTableV2Component<TItem>);
  protected readonly clipboard = inject(Clipboard);

  //#region IS SHIFT PRESSED
  public isShiftPressed$ = merge(
    this.table.container$.pipe(
      switchMap((container) => fromEvent<KeyboardEvent>(container, 'keydown')),
      filter(({ key }) => key == 'Shift'),
      map(({ shiftKey }) => shiftKey),
    ),
    this.table.container$.pipe(
      switchMap((container) => fromEvent<KeyboardEvent>(container, 'keyup')),
      filter(({ key }) => key == 'Shift'),
      map(({ shiftKey }) => shiftKey),
    ),
  ).pipe(
    startWith(false),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  //#endregion IS SHIFT PRESSED

  //#region DISABLED
  @Input('disabled') set disabledSetter(v: boolean | null) {
    if (v == null) return;
    this.disabled.next(v);
  }
  protected disabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false,
  );
  //#endregion DISABLED

  //#region READONLY
  @Input('readonly') set readonlySetter(v: boolean | null) {
    if (v == null) return;
    this.readonly.next(v);
  }
  protected readonly: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false,
  );
  protected ifNotReadonly<T>() {
    return (source$: Observable<T>) =>
      source$.pipe(
        withLatestFrom(this.readonly),
        filter(([_, readonly]) => !readonly),
        map(([value]) => value),
      );
  }
  //#endregion READONLY

  //#region MODE
  @Input('mode') set modeSetter(v: 'single' | 'multiple') {
    this.mode.next(v);
  }
  protected mode: BehaviorSubject<'single' | 'multiple'> = new BehaviorSubject<
    'single' | 'multiple'
  >('single');
  protected ifSingleMode<T>() {
    return (source$: Observable<T>) =>
      source$.pipe(
        withLatestFrom(this.mode),
        filter(([_, mode]) => mode == 'single'),
        map(([value]) => value),
      );
  }
  protected ifMultipleMode<T>() {
    return (source$: Observable<T>) =>
      source$.pipe(
        withLatestFrom(this.mode),
        filter(([_, mode]) => mode == 'multiple'),
        map(([value]) => value),
      );
  }
  //#endregion MODE

  //#region KEYBOARD EVENTS
  protected onKeyDown$: Observable<{
    event: KeyboardEvent;
    columns: ImperiaTableColumn<TItem>[];
    rows: ImperiaTableRow<TItem>[];
    footerRows: ImperiaTableRow<TItem>[];
  }> = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    filter(({ code }) =>
      ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Space'].includes(
        code,
      ),
    ),
    withLatestFrom(this.table.isFocused$, this.table.editCellElementIsClicked$),
    filter(([_, focus, isClicked]) => focus && !isClicked),
    map(([event, _]) => event),
    withLatestFrom(
      this.table.orderedColumns$,
      this.table.rows$,
      this.table.footerRows$,
    ),
    map(([event, { columns }, rows, footerRows]) => ({
      event,
      columns,
      rows,
      footerRows,
    })),
    share(),
  );
  public onArrowUp$ = this.onKeyDown$.pipe(
    filter(({ event }) => event.code == 'ArrowUp'),
  );
  public onArrowDown$ = this.onKeyDown$.pipe(
    filter(({ event }) => event.code == 'ArrowDown'),
  );
  //#endregion KEYBOARD EVENTS

  protected preventAndStopPropagation<T>(
    pluckFn: (value: T) => Event = (value) => value as any,
  ) {
    return (source$: Observable<T>) =>
      source$.pipe(
        tap((value) => {
          const event = pluckFn(value);
          if ('preventDefault' in event) {
            event.preventDefault();
          }
          if ('stopImmediatePropagation' in event) {
            event.stopImmediatePropagation();
          }
        }),
      );
  }
}
