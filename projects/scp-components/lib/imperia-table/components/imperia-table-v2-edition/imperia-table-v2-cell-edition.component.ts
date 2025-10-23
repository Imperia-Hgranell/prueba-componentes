import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { httpRequestState } from '@imperiascm/rxjs-utils';
import { getCell, getRow, getRowCell, isFooterCell, valueHasChanged } from '../../directives/editable-cell.functions';
import { ImperiaFormDataSyncState } from '../../../imperia-form/models/imperia-form.types';
import { ImpInputHelpComponent } from '../../../imp-input-help/components/imp-input-help/imp-input-help.component';
import { ImpInputNumberComponent } from '../../../primeng/imp-input-number/imp-input-number.component';
import { ImperiaTableColumn, ImperiaTableColumnDataInfo } from '../../models/imperia-table-columns.models';
import { IImperiaTableColumnDataBoolean, TImperiaTableColumnDataInfoTypes } from '../../models/imperia-table-columns.types';
import { ImperiaTableCellEditEvent } from '../../models/imperia-table-editing.models';
import { ImperiaTableBodyCellTemplateContext } from '../../template-directives/imperia-table-body-cell-template.directive';
import moment from 'moment';
import { Dropdown } from 'primeng/dropdown';
import {
  Observable,
  ReplaySubject,
  animationFrameScheduler,
  delay,
  filter,
  fromEvent,
  map,
  merge,
  share,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ImpInputCalendarComponent } from '@imperiascm/scp-components/imp-input-calendar';

@Component({
  selector: 'imperia-table-v2-cell-edition',
  templateUrl: './imperia-table-v2-cell-edition.component.html',
  styleUrls: ['./imperia-table-v2-cell-edition.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV2CellEditionComponent<TItem extends object> {
  //#region CONTEXT
  @Input('ctx') set ctxSetter(
    v: ImperiaTableBodyCellTemplateContext['$implicit'] | null
  ) {
    if (!v) return;
    this.ctx.next(v);
  }
  public ctx = new ReplaySubject<
    ImperiaTableBodyCellTemplateContext['$implicit']
  >(1);
  public ctx$ = this.ctx.pipe(
    map(({ col, colIndex, row, rowIndex }) => ({
      col: col,
      colIndex: colIndex,
      row: row,
      rowIndex: rowIndex,
      cellElement: {
        nativeElement: this.el.nativeElement
          .parentElement as HTMLTableCellElement,
      },
      cell: row.cells[col.field],
      result: (state: httpRequestState) => {
        const cell = row.cells[col.field];
        cell.setState(state, row);
      },
      editableCellValueSyncFn: (state: ImperiaFormDataSyncState) => {},
    })),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion CONTEXT

  //#region STRING EDITOR
  @ViewChild('stringEditor') set stringEditorSetter(
    v: ElementRef<HTMLInputElement> | undefined
  ) {
    if (!v) return;
    setTimeout(() => v.nativeElement.focus(), 0);
  }
  //#endregion STRING EDITOR

  //#region NUMBER EDITOR
  @ViewChild('numberEditor') set numberEditorSetter(
    v: ImpInputNumberComponent | undefined
  ) {
    if (!v) return;
    setTimeout(() => v.focus(), 0);
  }
  //#endregion NUMBER EDITOR

  //#region BOOLEAN EDITOR
  @ViewChild('booleanEditor') set booleanEditorSetter(v: Dropdown | undefined) {
    if (!v) return;
    this.booleanEditor.next(v);
  }
  private booleanEditor = new ReplaySubject<Dropdown>(1);
  private booleanEditor$ = this.booleanEditor.pipe(
    delay(0, animationFrameScheduler),
    tap((editor) => editor.show()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion BOOLEAN EDITOR

  //#region DATE EDITOR
  @ViewChild('dateEditor') set dateEditorSetter(
    v: ImpInputCalendarComponent | undefined
  ) {
    if (!v) return;
    this.dateEditor.next(v);
  }
  private dateEditor = new ReplaySubject<ImpInputCalendarComponent>(1);
  private dateEditor$ = this.dateEditor.pipe(
    delay(0, animationFrameScheduler),
    tap((editor) => editor.focus()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion DATE EDITOR

  //#region SELECT EDITOR
  @ViewChild('selectEditor') set selectEditorSetter(v: Dropdown | undefined) {
    if (!v) return;
    this.selectEditor.next(v);
  }
  private selectEditor = new ReplaySubject<Dropdown>(1);
  private selectEditor$ = this.selectEditor.pipe(
    delay(0, animationFrameScheduler),
    tap((editor) => editor.show()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion SELECT EDITOR

  //#region STRING WITH HELP EDITOR
  @ViewChild('stringWithHelpEditor') set stringWithHelpEditorSetter(
    v: ImpInputHelpComponent<TItem> | undefined
  ) {
    if (!v) return;
    this.stringWithHelpEditor.next(v);
  }
  private stringWithHelpEditor = new ReplaySubject<
    ImpInputHelpComponent<TItem>
  >(1);
  private stringWithHelpEditor$ = this.stringWithHelpEditor.pipe(
    delay(0, animationFrameScheduler),
    tap((editor) => editor.focus()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion STRING WITH HELP EDITOR

  //#region BOOLEAN EDITOR CHANGE
  private onBooleanEditorChange$ = this.booleanEditor$.pipe(
    switchMap((dropdown) => dropdown.onChange.pipe(take(1))),
    switchMap(() => this.ctx$.pipe(take(1))),
    tap((ctx) => (ctx.cell.dataInfo.editing = false))
  );
  //#endregion BOOLEAN EDITOR CHANGE

  //#region SELECT EDITOR CHANGE
  public onSelectEditorChange$ = this.selectEditor$.pipe(
    switchMap((dropdown) => dropdown.onChange.pipe(take(1))),
    switchMap(() => this.ctx$.pipe(take(1))),
    tap((ctx) => (ctx.cell.dataInfo.editing = false))
  );
  //#endregion SELECT EDITOR CHANGE

  //#region DATE EDITOR CHANGE
  private onDateEditorChange$ = this.dateEditor$.pipe(
    switchMap((editor) => editor.onSelect.pipe(take(1))),
    switchMap(() => this.ctx$.pipe(take(1))),
    filter((ctx) => {
      const prevValue = ctx.row.data[ctx.cell.field];
      const currValue = ctx.cell.control.value;
      return !moment(prevValue).isSame(currValue, 'day');
    }),
    tap((ctx) => (ctx.cell.dataInfo.editing = false))
  );
  //#endregion DATE EDITOR CHANGE

  //#region STRING WITH HELP EDITOR CHANGE
  private onStringWithHelpEditorChange$ = this.stringWithHelpEditor$.pipe(
    switchMap((editor) => editor.onSelect.pipe(take(1))),
    switchMap(() => this.ctx$.pipe(take(1))),
    tap((ctx) => (ctx.cell.dataInfo.editing = false))
  );
  //#endregion STRING WITH HELP EDITOR CHANGE

  //#region ON WINDOW MOUSE DOWN
  public onWindowMouseDown$ = this.ctx$.pipe(
    delay(0, animationFrameScheduler),
    switchMap((ctx) =>
      fromEvent(window, 'click').pipe(
        map((event) => ({ ctx, target: event.target })),
        shareReplay({ bufferSize: 1, refCount: true })
      )
    )
  );
  //#endregion ON WINDOW MOUSE DOWN

  //#region ON OUTSIDE CLICK
  public onOutsideClick$ = this.onWindowMouseDown$.pipe(
    filter(({ target }) => {
      const tar = target as Element;

      const isInDatePicker =
        tar.closest('.p-datepicker') ||
        tar.closest('.p-datepicker-next-icon') ||
        tar.closest('.p-datepicker-prev-icon');
      const isDatePickerElement = /p-(year|month|date|time)picker/.test(
        tar.className
      );

      return !(isInDatePicker || isDatePickerElement);
    }),
    filter(({ target }) => {
      return !this.el.nativeElement.contains(target as Node);
    }),
    take(1),
    tap(({ ctx }) => (ctx.cell.dataInfo.editing = false)),
    map(({ ctx }) => ctx)
  );
  //#endregion ON OUTSIDE CLICK

  //#region HAS BEEN CLICK INSIDE
  @Output('hasBeenClickInside')
  public hasBeenClickInside$: Observable<boolean> =
    this.onWindowMouseDown$.pipe(
      filter(({ target }) => this.el.nativeElement.contains(target as Node)),
      take(1),
      map(() => true),
      startWith(false),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  //#endregion HAS BEEN CLICK INSIDE

  //#region KEYDOWN EVENTS
  public onKeydown$ = this.ctx$.pipe(
    switchMap((ctx) =>
      fromEvent<KeyboardEvent>(ctx.cellElement.nativeElement, 'keydown').pipe(
        map((event) => ({ ctx, event }))
      )
    ),
    share()
  );

  public onEnter$ = this.onKeydown$.pipe(
    filter(({ event }) => event.key === 'Enter'),
    map(({ ctx }) => ({
      ctx,
      specificCell: this.getSpecificVerticalCell(
        ctx.cellElement,
        ctx.col,
        'next',
        false
      ),
    })),
    filter(({ specificCell }) => specificCell),
    map(({ ctx }) => ctx)
  );

  public onEscape$ = this.onKeydown$.pipe(
    filter(({ event }) => event.key === 'Escape'),
    map(({ ctx }) => ctx),
    tap((ctx) => (ctx.cell.dataInfo.editing = false))
  );

  public onArrowUp$ = this.onKeydown$.pipe(
    filter(({ event }) => event.key === 'ArrowUp'),
    tap(({ event }) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    }),
    withLatestFrom(this.hasBeenClickInside$),
    map(([{ ctx }, hasBeenClickInside]) => ({
      ctx,
      specificCell: this.getSpecificVerticalCell(
        ctx.cellElement,
        ctx.col,
        'previous',
        hasBeenClickInside
      ),
    })),
    filter(({ specificCell }) => specificCell),
    map(({ ctx }) => ctx)
  );

  public onArrowDown$ = this.onKeydown$.pipe(
    filter(({ event }) => event.key === 'ArrowDown'),
    tap(({ event }) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    }),
    withLatestFrom(this.hasBeenClickInside$),
    map(([{ ctx }, hasBeenClickInside]) => ({
      ctx,
      specificCell: this.getSpecificVerticalCell(
        ctx.cellElement,
        ctx.col,
        'next',
        hasBeenClickInside
      ),
    })),
    filter(({ specificCell }) => specificCell),
    map(({ ctx }) => ctx)
  );

  public onArrowLeft$ = this.onKeydown$.pipe(
    filter(({ event }) => event.key === 'ArrowLeft'),
    tap(({ event }) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    }),
    withLatestFrom(this.hasBeenClickInside$),
    map(([{ ctx }, hasBeenClickInside]) => ({
      ctx,
      specificCell: this.getSpecificHorizontalCell(
        ctx.cellElement,
        'previous',
        hasBeenClickInside
      ),
    })),
    filter(({ specificCell }) => specificCell),
    map(({ ctx }) => ctx)
  );

  public onArrowRight$ = this.onKeydown$.pipe(
    filter(({ event }) => event.key === 'ArrowRight'),
    tap(({ event }) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    }),
    withLatestFrom(this.hasBeenClickInside$),
    map(([{ ctx }, hasBeenClickInside]) => ({
      ctx,
      specificCell: this.getSpecificHorizontalCell(
        ctx.cellElement,
        'next',
        hasBeenClickInside
      ),
    })),
    filter(({ specificCell }) => specificCell),
    map(({ ctx }) => ctx)
  );

  public onKeydownEvents$ = merge(
    this.onEnter$,
    this.onEscape$,
    this.onArrowUp$,
    this.onArrowDown$,
    this.onArrowLeft$,
    this.onArrowRight$
  ).pipe(tap((ctx) => (ctx.cell.dataInfo.editing = false)));
  //#endregion KEYDOWN EVENTS

  //#region SAVE
  @Output('onSave') public onSave$: Observable<
    ImperiaTableCellEditEvent<TItem>
  > = merge(
    this.onBooleanEditorChange$,
    this.onSelectEditorChange$,
    this.onDateEditorChange$,
    this.onStringWithHelpEditorChange$,
    this.onKeydownEvents$,
    this.onOutsideClick$
  ).pipe(
    take(1),
    filter((ctx) => {
      if (valueHasChanged(ctx.cell, ctx.row.data)) return true;

      ctx.cell.setState({ canceled: true }, ctx.row);
      ctx.row.cells[ctx.col.field].value = ctx.row.data[ctx.col.field];
      return false;
    }),
    filter((ctx) => {
      if (ctx.cell.control.valid) return true;

      ctx.cell.setState({ ok: false }, ctx.row);
      return false;
    }),
    tap((ctx) => {
      ctx.row.cells[ctx.col.field].value = ctx.cell.control.value;
      ctx.cell.setState({ loading: true }, ctx.row);
    })
  );
  //#endregion SAVE

  constructor(private el: ElementRef<HTMLElement>) {}

  public getSpecificVerticalCell(
    cellElement: ElementRef<HTMLTableCellElement> | null,
    col: ImperiaTableColumn<any, TImperiaTableColumnDataInfoTypes>,
    direction: 'next' | 'previous',
    hasBeenClickInside: boolean
  ) {
    if (!cellElement) return false;
    if (hasBeenClickInside) {
      const inputs = cellElement.nativeElement.querySelectorAll('input');
      const input = inputs[0];
      !!input && direction === 'previous' && input.setSelectionRange(0, 0);
      !!input &&
        direction === 'next' &&
        input.setSelectionRange(input.value.length, input.value.length);
      return false;
    }
    const nextCdkRowCell = getRowCell(getRow(cellElement, direction), col);

    if (!nextCdkRowCell) return false;
    //Si existe la celda siguiente
    if (isFooterCell(nextCdkRowCell)) return false;
    //Y no es el footer
    (nextCdkRowCell as HTMLElement).click();
    return true;
  }

  public getSpecificHorizontalCell(
    cellElement: ElementRef<HTMLTableCellElement> | null,
    direction: 'next' | 'previous',
    hasBeenClickInside: boolean
  ) {
    if (hasBeenClickInside) return false;
    if (!cellElement) return false;

    const nextCdkRowCell = getCell(cellElement, direction);

    if (!nextCdkRowCell) return false;
    //Si existe la celda siguiente
    if (isFooterCell(nextCdkRowCell)) return false;
    //Y no es el footer
    (nextCdkRowCell as HTMLElement).click();
    return true;
  }

  public getWidth(col: ImperiaTableColumn<TItem>): string {
    const width = col.width != 'auto' ? col.width + col.widthUnit : col.width;
    if (col.dataInfo.editing && col.dataInfo.editingColWidth) {
      return col.dataInfo.editingColWidth + col.widthUnit;
    }
    return width;
  }

  public onDateInputChange(event: Date, control: FormControl) {
    control.setValue(event);
  }

  public onCheckBoxInputChange(
    event: any,
    control: FormControl,
    dataInfo: Partial<ImperiaTableColumnDataInfo> &
      IImperiaTableColumnDataBoolean
  ) {
    event.target.checked
      ? control.setValue(dataInfo.trueValue)
      : control.setValue(dataInfo.falseValue);
  }
}
