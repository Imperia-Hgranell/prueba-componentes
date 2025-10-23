import { CdkTable } from '@angular/cdk/table';
import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';

export interface ResizeColumnEvent<TItem extends object> {
  columnResized: ImperiaTableColumn<TItem>;
  columnIndex: number;
  table: HTMLElement;
}
/**
 * @deprecated
 */
@Directive({
  selector: '[resizable]',
    standalone: false
})
export class ResizeColumnDirective<TItem extends object> implements OnInit {
  @Input() resizable: boolean = false;
  @Input('resizableColumn') column!: ImperiaTableColumn<TItem>;
  @Input('resizableColumnIndex') columnIndex!: number;

  private startX!: number;
  private startWidth!: number;
  private newWidth!: number;
  private colEleRef!: HTMLElement;
  private table!: HTMLElement;
  private pressed!: boolean;
  private resizingIndicator!: HTMLElement;

  @Output() onResizeEnd: EventEmitter<ResizeColumnEvent<TItem>> =
    new EventEmitter<ResizeColumnEvent<TItem>>();

  constructor(
    private cdkTable: CdkTable<TItem>,
    private renderer: Renderer2,
    private el: ElementRef,
  ) {
    this.colEleRef = this.el.nativeElement;
  }

  ngOnInit() {
    if (this.resizable) {
      const row = this.renderer.parentNode(this.colEleRef);
      this.table = this.renderer.parentNode(row);
      const resizerStart = this.createResizer(this.column.frozenPosition);
      this.renderer.appendChild(this.colEleRef, resizerStart);
      this.renderer.listen(resizerStart, 'mousedown', this.onMouseDown);
      this.renderer.listen('document', 'mousemove', this.onMouseMove);
      this.renderer.listen('document', 'mouseup', this.onMouseUp);
      this.resizingIndicator = this.renderer.createElement('div');
      this.renderer.addClass(this.resizingIndicator, 'resizing-indicator');
      this.renderer.setStyle(
        this.resizingIndicator,
        'height',
        this.colEleRef.clientHeight + 'px',
      );
      this.renderer.setStyle(this.resizingIndicator, 'width', '1px');
      this.renderer.setStyle(
        this.resizingIndicator,
        'background-color',
        '#a19f9d',
      );
      this.renderer.setStyle(this.resizingIndicator, 'position', 'absolute');
      this.renderer.setStyle(this.resizingIndicator, 'z-index', '10');
    }
  }

  onMouseDown = (event: MouseEvent) => {
    this.pressed = true;
    this.startX = event.pageX;
    this.startWidth = this.colEleRef.clientWidth;
    this.renderer.setStyle(document.body, 'cursor', 'col-resize');
    this.column.resizing = true;
    this.renderer.appendChild(document.body, this.resizingIndicator);
    this.renderer.setStyle(
      this.resizingIndicator,
      'left',
      `${event.clientX}px`,
    );
    this.renderer.setStyle(
      this.resizingIndicator,
      'top',
      `${event.clientY - event.offsetY}px`,
    );
  };

  onMouseMove = (event: MouseEvent) => {
    if (this.pressed && event.buttons) {
      this.renderer.addClass(this.table, 'resizing');
      //Para calcular primero calculamos la diferencia entre el punto de inicio y el punto actual
      //Luego multiplicamos por -1 si la columna es de la derecha para hacer negativo el numero
      //Y por 1 si la columna es de la izquierda
      this.newWidth =
        this.startWidth +
        (event.pageX - this.startX) *
          (this.column.frozenPosition == 'right' ? -1 : 1);

      //Comprobaciones de que minWidth y maxWidth no sean none
      const minWidth =
        this.column._minWidth == 0 || this.column.minWidthUnit == '%'
          ? 0
          : this.column._minWidth;
      const maxWidth =
        this.column._maxWidth == 'none' || this.column.maxWidthUnit == '%'
          ? this.newWidth
          : this.column._maxWidth;
      //Esto es para ir moviendo el indicador de donde se quedara el nuevo ancho de la columna
      if (this.newWidth < minWidth) {
        this.newWidth = minWidth;
        return;
      }
      if (this.newWidth > maxWidth) {
        this.newWidth = maxWidth;
        return;
      }
      this.renderer.setStyle(
        this.resizingIndicator,
        'left',
        `${event.clientX}px`,
      );
    }
  };

  onMouseUp = (event: MouseEvent) => {
    if (this.pressed) {
      this.pressed = false;
      this.renderer.setStyle(document.body, 'cursor', 'default');
      this.renderer.removeChild(document.body, this.resizingIndicator);

      if (this.column.widthUnit == '%' && this.column.width != 'auto') {
        const percentagePerPixel =
          this.column.width / this.colEleRef.clientWidth;

        this.column.width =
          Math.round(
            (percentagePerPixel * this.newWidth + Number.EPSILON) * 100,
          ) / 100;
      } else {
        this.column.width =
          Math.round((this.newWidth + Number.EPSILON) * 100) / 100;
      }
      this.column.hasBeenResized = true;

      this.renderer.setStyle(
        this.colEleRef,
        'width',
        `${this.column.width}${this.column.widthUnit}`,
      );

      /* const bodyRows = Array.from(this.table.querySelectorAll('.cdk-row'));
      const columnCells = bodyRows.map((row: Element) =>
        getRowCell(row, this.column)
      );
      for (const cell of columnCells) {
        if (!cell) continue;
        this.renderer.setStyle(
          cell,
          'width',
          `${this.column.width}${this.column.widthUnit}`
        );
        this.renderer.setStyle(
          cell,
          'maxWidth',
          `${this.column.width}${this.column.widthUnit}`
        );
        this.renderer.setStyle(
          cell,
          'minWidth',
          `${this.column.width}${this.column.widthUnit}`
        );
      } */

      setTimeout(() => {
        this.cdkTable.updateStickyHeaderRowStyles();
        this.cdkTable.updateStickyColumnStyles();
      }, 100);
      this.onResizeEnd.emit({
        columnResized: this.column,
        columnIndex: this.columnIndex,
        table: this.table,
      });
      setTimeout(() => {
        this.column.resizing = false;
        this.renderer.removeClass(this.table, 'resizing');
      }, 500);
    }
  };

  private createResizer(colPosition: 'left' | 'right') {
    const resizer = this.renderer.createElement('div');
    this.renderer.setStyle(resizer, 'position', 'absolute');
    this.renderer.setStyle(
      resizer,
      colPosition == 'left' ? 'right' : 'left',
      '0',
    );
    this.renderer.setStyle(resizer, 'margin-bottom', '-6px');
    this.renderer.addClass(resizer, 'resize-holder');
    this.renderer.setStyle(resizer, 'height', '100%');
    this.renderer.setStyle(resizer, 'width', '10px');
    this.renderer.setStyle(resizer, 'cursor', 'col-resize');
    return resizer;
  }
}
