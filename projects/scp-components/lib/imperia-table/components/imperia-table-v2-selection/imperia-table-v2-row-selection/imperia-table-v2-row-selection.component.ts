import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ImperiaTableV2BaseSelectionDirective } from '../imperia-table-v2-selection.directive';
import { ImperiaTableRow } from '../../../models/imperia-table-rows.models';
import { ImperiaTableBodyCellContextMenuContext } from '../../../template-directives/imperia-table-body-cell-context-menu-template.directive';
import saveAs from 'file-saver';
import {
  BehaviorSubject,
  Observable,
  Subject,
  animationFrameScheduler,
  catchError,
  concatMap,
  debounceTime,
  delay,
  endWith,
  filter,
  finalize,
  first,
  from,
  interval,
  last,
  map,
  merge,
  of,
  pairwise,
  reduce,
  repeat,
  scheduled,
  share,
  shareReplay,
  startWith,
  switchMap,
  take,
  takeWhile,
  tap,
  withLatestFrom,
  zipWith,
} from 'rxjs';

class CopyingRowsVM {
  state: boolean;
  from: 'row' | 'selection' | null;
  totalRowsToCopy: number;
  result: boolean | null;
  constructor(copying: Partial<CopyingRowsVM> = {}) {
    this.state = copying.state ?? false;
    this.from = copying.from ?? null;
    this.totalRowsToCopy = copying.totalRowsToCopy ?? 0;
    this.result = copying.result ?? null;
  }
}

@Component({
  selector: 'imperia-table-v2-row-selection',
  templateUrl: './imperia-table-v2-row-selection.component.html',
  styleUrls: ['./imperia-table-v2-row-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ImperiaTableV2RowSelectionComponent<
  TItem extends object,
> extends ImperiaTableV2BaseSelectionDirective<TItem> {
  @ViewChild('copyTemplate') public copyTemplate!: TemplateRef<
    ImperiaTableBodyCellContextMenuContext<TItem>
  >;

  //#region IS SELECTED FUNCTION
  @Input('isSelectedFn') isSelected = (
    row: ImperiaTableRow<TItem>,
    currentSelection: TItem[],
  ) => {
    if (currentSelection == null) return false;
    return currentSelection.some((item) =>
      this.table.dataKeyValue(item) == undefined
        ? item == row.data
        : this.table.dataKeyValue(item) == row.dataKeyValue,
    );
  };
  //#endregion IS SELECTED FUNCTION

  //#region FROM INPUT
  @Input('selection') set selectionSetter(v: TItem[] | null) {
    if (!v) return;
    this.selectionFromInput.next(v);
  }
  private selectionFromInput: BehaviorSubject<TItem[]> = new BehaviorSubject<
    TItem[]
  >([]);
  //#endregion FROM INPUT

  //#region FROM VALUE CHANGE
  private selectionFromValueChange$: Observable<TItem[]> =
    this.table.value.pipe(
      switchMap((items) =>
        this.selection$.pipe(
          take(1),
          map((currentSelection) =>
            items.filter((item) =>
              currentSelection.some(
                (selectedItem) =>
                  this.table.dataKeyValue(item) ===
                  this.table.dataKeyValue(selectedItem),
              ),
            ),
          ),
        ),
      ),
    );
  //#endregion FROM VALUE CHANGE

  //#region FROM CLICK
  public select = (event: MouseEvent, row: ImperiaTableRow<TItem>) =>
    this._select.next({ event, row });
  private _select = new Subject<{
    event: MouseEvent;
    row: ImperiaTableRow<TItem>;
  }>();
  private selectionFromClick$: Observable<TItem[]> = merge(
    this.table.click$.pipe(
      map(({ row, rowSelection, event }) => ({ row, rowSelection, event })),
    ),
    this._select.pipe(
      withLatestFrom(this.table.rowSelection$),
      map(([{ row, event }, rowSelection]) => ({ row, rowSelection, event })),
    ),
  ).pipe(
    this.ifNotReadonly(),
    withLatestFrom(this.mode, this.table.value),
    map(([{ row, rowSelection, event }, mode, items]) => {
      if (mode == 'single') return [row.data];
      if (event.shiftKey) {
        //if shift is pressed, select all rows between the first item selected and the current selection
        const firstSelectedIndex = items.findIndex((item) =>
          rowSelection
            .map((selectedItem) => this.table.dataKeyValue(selectedItem))
            .includes(this.table.dataKeyValue(item)),
        );
        const lastSelectedIndex = items.findIndex(
          (item) => this.table.dataKeyValue(item) == row.dataKeyValue,
        );
        const minIndex = Math.min(firstSelectedIndex, lastSelectedIndex);
        const maxIndex = Math.max(firstSelectedIndex, lastSelectedIndex);
        return items.slice(minIndex, maxIndex + 1);
      }
      if (event.ctrlKey) {
        return this.isSelected(row, rowSelection) //if is already selected, remove it from selection
          ? rowSelection.filter(
              (item) => this.table.dataKeyValue(item) != row.dataKeyValue,
            )
          : [...rowSelection, row.data]; //if is not selected, add it to selection
      }
      return [row.data]; //if no key is pressed, select only the current row
    }),
  );
  //#endregion FROM CLICK

  //#region FROM CONTEXT MENU
  private selectionFromContextMenu$: Observable<TItem[]> =
    this.table.contextMenu$.pipe(
      this.ifNotReadonly(),
      withLatestFrom(this.mode),
      map(([{ row, rowSelection: selection }, mode]) => {
        if (mode == 'single') return [row.data];
        const isSelected = this.isSelected(row, selection);
        if (isSelected) return selection;
        return [row.data];
      }),
    );
  //#endregion FROM CONTEXT MENU

  //#region FROM ARROW UP
  private selectionFromArrowUp$: Observable<TItem[]> = this.onArrowUp$.pipe(
    this.ifNotReadonly(),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(this.mode, this.table.viewport$),
    switchMap(([{ event, rows }, mode, viewport]) =>
      this.selection$.pipe(
        take(1),
        filter((currentSelection) => !!currentSelection.length),
        map((currentSelection) => {
          const lastItemSelectedIndex = rows.findIndex(
            (row) =>
              row.dataKeyValue ==
              this.table.dataKeyValue(
                currentSelection[currentSelection.length - 1],
              ),
          );
          const previousIndex = lastItemSelectedIndex - 1;
          if (mode == 'single') {
            if (previousIndex < 0) return currentSelection;
            viewport.scrollToIndex(previousIndex, 'smooth');
            return [rows[previousIndex].data];
          }
          if (event.shiftKey) {
            if (previousIndex < 0) return currentSelection;
            viewport.scrollToIndex(previousIndex, 'smooth');
            return [...currentSelection, rows[previousIndex].data];
          }
          if (previousIndex < 0) {
            return [rows[lastItemSelectedIndex].data];
          }
          viewport.scrollToIndex(previousIndex, 'smooth');
          return [rows[previousIndex].data];
        }),
      ),
    ),
  );
  //#endregion FROM ARROW UP

  //#region FROM ARROW DOWN
  private selectionFromArrowDown$: Observable<TItem[]> = this.onArrowDown$.pipe(
    this.ifNotReadonly(),
    this.preventAndStopPropagation(({ event }) => event),
    withLatestFrom(this.mode, this.table.viewport$),
    switchMap(([{ event, rows }, mode, viewport]) =>
      this.selection$.pipe(
        take(1),
        filter((currentSelection) => !!currentSelection.length),
        map((currentSelection) => {
          const lastItemSelectedIndex = rows.findIndex(
            (row) =>
              row.dataKeyValue ==
              this.table.dataKeyValue(
                currentSelection[currentSelection.length - 1],
              ),
          );
          const nextIndex = lastItemSelectedIndex + 1;
          if (mode == 'single') {
            if (nextIndex >= rows.length) return currentSelection;
            viewport.scrollToIndex(nextIndex, 'smooth');
            return [rows[nextIndex].data];
          }
          if (event.shiftKey) {
            if (nextIndex >= rows.length) return currentSelection;
            viewport.scrollToIndex(nextIndex, 'smooth');
            return [...currentSelection, rows[nextIndex].data];
          }
          if (nextIndex >= rows.length) {
            return [rows[lastItemSelectedIndex].data];
          }
          viewport.scrollToIndex(nextIndex, 'smooth');
          return [rows[nextIndex].data];
        }),
      ),
    ),
  );
  //#endregion FROM ARROW DOWN

  //#region CHANGE
  @Output('selectionChange') selectionChangeEmitter: EventEmitter<TItem[]> =
    new EventEmitter<TItem[]>();
  public selection$: Observable<TItem[]> = this.disabled.pipe(
    switchMap((disabled) =>
      disabled
        ? of([])
        : merge(
            this.selectionFromInput,
            this.selectionFromValueChange$,
            this.selectionFromClick$,
            this.selectionFromContextMenu$,
            this.selectionFromArrowUp$,
            this.selectionFromArrowDown$,
          ).pipe(
            startWith<TItem[]>([]),
            pairwise(),
            filter(
              ([prev, curr]) =>
                prev.length != curr.length ||
                curr.some((item) => !prev.includes(item)) ||
                prev.some((item) => !curr.includes(item)),
            ),
            map(([prev, curr]) => curr),
            tap((selection) => this.selectionChangeEmitter.emit(selection)),
            startWith<TItem[]>([]),
          ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  //#endregion CHANGE

  //#region ROWS COPY
  @ViewChild('tableToCopyRows', { static: true })
  tableToCopyRows!: ElementRef<HTMLTableElement>;
  public onCopyRows = new Subject<{
    items: TItem[];
    from: 'row' | 'selection';
  }>();

  public onCopyRows$ = this.onCopyRows.pipe(
    withLatestFrom(this.table.columnsConfigured$),
    map(([{ items, from }, columns]) => ({
      items,
      from,
      columns: columns.filter(({ visible }) => visible),
    })),
    share(),
  );

  public rowsToCopy$ = this.onCopyRows$.pipe(
    map(({ items, columns }) => this.table.mapToRows(items, columns)),
    share(),
  );

  public rowToCopyRendered$ = this.rowsToCopy$.pipe(
    concatMap((rows) =>
      scheduled(rows, animationFrameScheduler).pipe(endWith(null)),
    ),
    takeWhile((text) => text != null, true),
    share(),
  );

  private rowToCopyCopied$ = this.rowToCopyRendered$.pipe(
    map(() => this.tableToCopyRows.nativeElement.querySelector('tr')),
    map(this.getCellsInnerText),
    map((textToCopy, index) => ({ textToCopy, count: index })),
    share(),
  );

  private textToCopy$ = this.rowToCopyCopied$.pipe(
    map(({ textToCopy }) => textToCopy),
    filter((textToCopy): textToCopy is string => textToCopy != null),
    reduce((textToCopy, curr) => textToCopy + curr + '\n', ''),
    share(),
  );

  public currentRowCountBeingCopied$ = this.rowToCopyCopied$.pipe(
    filter(({ textToCopy }) => textToCopy != null),
    map(({ count }) => count),
    delay(0, animationFrameScheduler),
    repeat(),
    startWith(0),
    share(),
  );

  private textCopied$ = this.textToCopy$.pipe(
    last(),
    switchMap((textToCopy) =>
      this.copyToClipboard(textToCopy).pipe(
        map((copied) => ({
          copied,
          textToCopy,
        })),
      ),
    ),
    tap(
      ({ copied, textToCopy }) => !copied && this.generateCsvFile(textToCopy),
    ),
    share(),
  );

  public copyingRows$: Observable<CopyingRowsVM> = merge(
    this.onCopyRows$.pipe(
      map(
        ({ from, items }) =>
          new CopyingRowsVM({
            state: true,
            from,
            totalRowsToCopy: items.length,
          }),
      ),
    ),
    this.textCopied$.pipe(
      withLatestFrom(this.onCopyRows$),
      repeat(),
      map(
        ([{ copied }, { from }]) =>
          new CopyingRowsVM({
            from,
            result: copied,
          }),
      ),
    ),
    this.textCopied$.pipe(
      repeat(),
      debounceTime(500),
      map(() => new CopyingRowsVM()),
    ),
  ).pipe(
    startWith(new CopyingRowsVM()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  public tableToCopyRowsVM$ = merge(
    this.onCopyRows$,
    this.textCopied$.pipe(
      repeat(),
      map(() => ({
        items: [],
        from: null,
        columns: [],
      })),
    ),
  ).pipe(
    startWith({
      items: [],
      from: null,
      columns: [],
    }),
  );

  private getCellsInnerText(row: HTMLTableRowElement | null): string | null {
    if (!row) return null;
    return Array.from(row.querySelectorAll('td'))
      .map((td) => td.innerText)
      .join('\t');
  }

  private copyToClipboard(textToCopy: string) {
    return new Observable<boolean>((subscriber) => {
      const pendingCopy = this.clipboard.beginCopy(textToCopy);
      const copyAttempts = Array.from({ length: 10 }).fill(null);
      const unsubscribe = () => {
        attemptCopy.unsubscribe();
        pendingCopy.destroy();
        subscriber.complete();
      };
      const attemptCopy = from(copyAttempts)
        .pipe(
          zipWith(interval(500)),
          takeWhile(([_, attempt]) => attempt < copyAttempts.length),
          map(() => pendingCopy.copy()),
          filter((copied) => copied),
          first(),
          catchError(() => of(false)),
          tap((copied) => subscriber.next(copied)),
          finalize(() => unsubscribe()),
        )
        .subscribe();

      return unsubscribe;
    });
  }

  private generateCsvFile(textToCopy: string) {
    const csv = new Blob([textToCopy.replace(/\t/g, ';')], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(csv, 'selection.csv');
  }
  //#endregion ROWS COPY
}
