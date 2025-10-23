import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ImperiaFormDataSyncState } from '../../imperia-form/models/imperia-form.types';
import { KEYS_FUNCTIONS, SELECT_KEYS_FUNCTIONS, TKeysFunctions, TSelectKeysFunctions, closeEditing, hasBeenClicked$, isEditable, markCellAs, setCellTemplateContext, valueHasChanged } from './editable-cell.functions';
import { ImperiaTableCell } from '../models/imperia-table-cells.models';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { ImperiaTableCellEditEvent } from '../models/imperia-table-editing.models';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';
import { filter, fromEvent, merge, takeUntil, tap } from 'rxjs';
/**
 * @deprecated
 */
@Directive({
  selector: '[editable]',
  standalone: false,
})
export class EditableCellDirective<TItem extends object>
  implements OnChanges, OnDestroy
{
  //#region INPUTS
  @Input('editable') enabled: boolean = false;
  @Input('editableRow') row!: ImperiaTableRow<TItem>;
  @Input('editableRowIndex') rowIndex!: number;
  @Input('editableCol') col!: ImperiaTableColumn<TItem>;
  @Input('editableColIndex') colIndex!: number;
  //#endregion INPUTS

  //#region OUTPUTS
  @Output() onEditInit: EventEmitter<ImperiaTableCellEditEvent<TItem>> =
    new EventEmitter<ImperiaTableCellEditEvent<TItem>>();
  @Output() onEditComplete: EventEmitter<ImperiaTableCellEditEvent<TItem>> =
    new EventEmitter<ImperiaTableCellEditEvent<TItem>>();
  @Output() onEditCancel: EventEmitter<ImperiaTableCellEditEvent<TItem>> =
    new EventEmitter<ImperiaTableCellEditEvent<TItem>>();
  //#endregion OUTPUTS

  private cellEditEvent!: ImperiaTableCellEditEvent<TItem>;

  private editableCellValueSyncFn: (state: ImperiaFormDataSyncState) => void = (
    state
  ) => {
    const cell = this.row.cells[this.col.field];
    if (state == 'saved') {
      Object.assign(this.row.data, { [cell.field]: cell.control.value });
      markCellAs('ok', this.cdkCell);
      cell.control.markAsPristine();
    } else if (state == 'error') {
      markCellAs('error', this.cdkCell);
    } else if (state == 'canceled') {
      setCellTemplateContext('reset', this);
      cell.control.setValue(this.row.data[this.col.field]);
      markCellAs('none', this.cdkCell);
    }
  };

  constructor(private cdkCell: ElementRef<HTMLDivElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    const cell = this.row.cells[this.col.field];
    if (changes['row'] || changes['col']) {
      this.row.cells[this.col.field].elementRef = this.cdkCell;
      this.cellEditEvent = {
        col: this.col,
        row: this.row,
        colIndex: this.colIndex,
        rowIndex: this.rowIndex,
        cellElement: this.cdkCell,
        result: (state) => {},
        editableCellValueSyncFn: this.editableCellValueSyncFn,
      };
    }
    if (changes['enabled']) {
      if (this.enabled && isEditable(cell, this.row)) {
        this.cdkCell.nativeElement.classList.add('editable');
        setCellTemplateContext('update', this);
      } else {
        this.cdkCell.nativeElement.classList.remove('editable');
        setCellTemplateContext('reset', this);
        closeEditing(cell, this.cdkCell);
      }
    }
  }

  ngOnDestroy(): void {
    this.row.cells[this.col.field].elementRef = null;
  }

  @HostListener('click')
  onClick() {
    //Si no es editable no hacemos nada
    if (!this.enabled) return;
    const cell = this.row.cells[this.col.field];
    //Si es readonly no hacemos nada
    if (!isEditable(cell, this.row)) return;
    this.openEditing(cell);
  }

  private openEditing(cell: ImperiaTableCell<TItem>) {
    //Ponemos la celda en modo edicion
    cell.dataInfo.editing = true;
    this.cdkCell.nativeElement.classList.add('editing');
    this.onEditInit.emit(this.cellEditEvent);
    //setTimeout para que se renderice el input
    setTimeout(() => {
      const input = this.cdkCell.nativeElement.querySelectorAll('input')[0];
      if (!input) return;
      let hasBeenClicked = false;
      hasBeenClicked$(input).subscribe((value) => (hasBeenClicked = value));
      input.focus();
      //Si es de tipo date
      this.ifDataInfoIsDate(cell, input);
      //Si es de tipo table
      this.ifDataInfoIsTable(cell);
      //Si es de tipo select
      this.ifDataInfoIsSelect(cell, input);
      //Si el input pierde el foco y su valor es diferente al inicial de la celda se cierra la edicion
      //Si es de tipo date, se gestiona en ifDataInfoIsDate
      //Si es de tipo table, se gestiona en ifDataInfoIsTable
      if (
        cell.dataInfo.type != 'table' &&
        cell.dataInfo.type != 'date' &&
        cell.dataInfo.type != 'select'
      ) {
        input.addEventListener(
          'blur',
          () => {
            closeEditing(cell, this.cdkCell, input);
            if (valueHasChanged(cell, this.row.data)) {
              setCellTemplateContext('update', this);
              if (cell.control.valid) {
                markCellAs('loading', this.cdkCell);
                this.row.cells[this.col.field].value = cell.control.value;
                this.onEditComplete.emit(this.cellEditEvent);
              } else {
                markCellAs('error', this.cdkCell);
              }
            } else {
              markCellAs('none', this.cdkCell);
              this.row.cells[this.col.field].value =
                this.row.data[this.col.field];
              this.onEditCancel.emit(this.cellEditEvent);
            }
          },
          { once: true }
        );
      }
      //Si se pulsa una tecla se ejecuta la funcion correspondiente
      input.addEventListener('keydown', (e) => {
        //Se busca la funcion correspondiente a la tecla pulsada
        const keyFunction =
          cell.dataInfo.type == 'select'
            ? SELECT_KEYS_FUNCTIONS[e.key as keyof TSelectKeysFunctions<TItem>]
            : KEYS_FUNCTIONS[e.key as keyof TKeysFunctions<TItem>];
        //Si existe la funcion se ejecuta
        if (keyFunction) {
          e.stopImmediatePropagation();
          if (
            keyFunction({
              input,
              cell,
              hasBeenClicked,
              ...this.cellEditEvent,
            })
          ) {
            e.preventDefault();
          }
        }
      });
    }, 0);
  }

  private ifDataInfoIsDate(
    cell: ImperiaTableCell<TItem>,
    input: HTMLInputElement
  ) {
    if (cell.dataInfo.type == 'date') {
      let hasBeenClicked = false;
      hasBeenClicked$(input).subscribe((value) => (hasBeenClicked = value));
      cell.dataInfo.overlayOpen
        .pipe(
          takeUntil(
            merge(
              cell.dataInfo.overlayOpen.pipe(filter((value) => !value)),
              fromEvent(input, 'keydown').pipe(
                filter((e): e is KeyboardEvent => e instanceof KeyboardEvent),
                filter(
                  (e) => !!KEYS_FUNCTIONS[e.key as keyof TKeysFunctions<TItem>]
                ),
                tap((e) => e.preventDefault()),
                tap((e) => e.stopImmediatePropagation()),
                filter((e) =>
                  KEYS_FUNCTIONS[e.key as keyof TKeysFunctions<TItem>]({
                    input,
                    cell,
                    hasBeenClicked,
                    ...this.cellEditEvent,
                  })
                )
              )
            )
          )
        )
        .subscribe({
          complete: () => {
            closeEditing(cell, this.cdkCell, input);
            if (valueHasChanged(cell, this.row.data)) {
              setCellTemplateContext('update', this);
              if (cell.control.valid) {
                markCellAs('loading', this.cdkCell);
                this.row.cells[this.col.field].value = cell.control.value;
                this.onEditComplete.emit(this.cellEditEvent);
              } else {
                markCellAs('error', this.cdkCell);
              }
            } else {
              markCellAs('none', this.cdkCell);
              this.row.cells[this.col.field].value =
                this.row.data[this.col.field];
              this.onEditCancel.emit(this.cellEditEvent);
            }
          },
        });
    }
  }

  private ifDataInfoIsTable(cell: ImperiaTableCell<TItem>) {
    if (cell.dataInfo.type == 'table') {
      //Si es de tipo table se suscribe al evento de cierre del overlay/modal
      //cuando da false se cierra la edicion
      //se desuscribe con el takeUntil que filtra los valores true
      //y solo se ejecuta cuando el valor es false
      cell.dataInfo.overlayOpen
        .pipe(
          takeUntil(cell.dataInfo.overlayOpen.pipe(filter((value) => !value)))
        )
        .subscribe({
          complete: () => {
            if (cell.control.valid) {
              this.row.cells[this.col.field].value = cell.control.value;
              this.onEditComplete.emit(this.cellEditEvent);
            } else {
              this.onEditCancel.emit(this.cellEditEvent);
            }
            closeEditing(cell, this.cdkCell);
          },
        });
    }
  }

  private ifDataInfoIsSelect(
    cell: ImperiaTableCell<TItem>,
    input: HTMLInputElement
  ) {
    if (cell.dataInfo.type == 'select') {
      let hasBeenClicked = false;
      hasBeenClicked$(input).subscribe((value) => (hasBeenClicked = value));
      cell.dataInfo.overlayOpen
        .pipe(
          takeUntil(
            merge(
              cell.dataInfo.overlayOpen.pipe(filter((value) => !value)),
              fromEvent(input, 'keydown').pipe(
                filter((e): e is KeyboardEvent => e instanceof KeyboardEvent),
                filter(
                  (e) =>
                    !!SELECT_KEYS_FUNCTIONS[
                      e.key as keyof TSelectKeysFunctions<TItem>
                    ]
                ),
                tap((e) => e.preventDefault()),
                tap((e) => e.stopImmediatePropagation()),
                filter((e) =>
                  SELECT_KEYS_FUNCTIONS[
                    e.key as keyof TSelectKeysFunctions<TItem>
                  ]({
                    input,
                    cell,
                    hasBeenClicked,
                    ...this.cellEditEvent,
                  })
                )
              )
            )
          )
        )
        .subscribe({
          complete: () => {
            closeEditing(cell, this.cdkCell, input);
            if (valueHasChanged(cell, this.row.data)) {
              setCellTemplateContext('update', this);
              if (cell.control.valid) {
                markCellAs('loading', this.cdkCell);
                this.row.cells[this.col.field].value = cell.control.value;
                this.onEditComplete.emit(this.cellEditEvent);
              } else {
                markCellAs('error', this.cdkCell);
              }
            } else {
              markCellAs('none', this.cdkCell);
              this.row.cells[this.col.field].value =
                this.row.data[this.col.field];
              this.onEditCancel.emit(this.cellEditEvent);
            }
          },
        });
    }
  }
}
