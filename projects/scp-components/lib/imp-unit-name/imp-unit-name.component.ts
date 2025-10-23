import { NgClass, NgIf, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  linkedSignal,
  Signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import {
  injectUnitColumnLabel,
  injectUnitNameErrorMessages,
} from '@imperiascm/scp-utils/currency-conversion';
import { ImperiaTableBodyCellTemplateContext } from '../imperia-table/template-directives/imperia-table-body-cell-template.directive';
import { ImperiaTableColumn } from '../imperia-table/models/imperia-table-columns.models';
import { ImperiaTableV2ColumnDirective } from '../imperia-table/directives/imperia-table-v2-column.directive';
import { TImperiaTableColumnDataInfoTypes } from '../imperia-table/models/imperia-table-columns.types';
import {
  CURRENCY_CONVERSION_ERROR,
  TYPE_AMOUNT_TYPES,
} from '@imperiascm/scp-utils/models';
import { UNIT_CONVERSION_ERROR } from '@imperiascm/scp-utils/constants';
import { CURRENCY_SYMBOL } from '@imperiascm/scp-utils/functions';
import { IMPERIA_TABLE_BODY_CELL_TEMPLATES_PROVIDER } from '../imperia-table-v3/imperia-table-body-cell-templates-provider';
import { ImpIconComponent } from '../imp-icon/imp-icon.component';
@Component({
  selector: 'imp-unit-name',
  imports: [ImpIconComponent, NgIf, NgTemplateOutlet, NgClass],
  providers: [
    {
      provide: IMPERIA_TABLE_BODY_CELL_TEMPLATES_PROVIDER,
      useExisting: ImpUnitNameComponent,
    },
  ],
  templateUrl: './imp-unit-name.component.html',
  styleUrl: './imp-unit-name.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpUnitNameComponent<TItem extends object> {
  //#region INJECT
  private readonly columnDirective = inject(ImperiaTableV2ColumnDirective);
  private column: ImperiaTableColumn<TItem> | null = null;
  //#endregion INJECT

  private readonly unitNameErrorMessages = injectUnitNameErrorMessages();
  private readonly unitColumnHeaders = injectUnitColumnLabel();
  //#region VIEW CHILD
  public $template: Signal<
    | TemplateRef<
        ImperiaTableBodyCellTemplateContext<
          TItem,
          TImperiaTableColumnDataInfoTypes,
          TImperiaTableColumnDataInfoTypes
        >
      >
    | undefined
  > = viewChild('unitNameTemplate');
  //#endregion VIEW CHILD

  //#region INPUTS
  public $context = input<
    | ImperiaTableBodyCellTemplateContext<
        TItem,
        TImperiaTableColumnDataInfoTypes,
        TImperiaTableColumnDataInfoTypes
      >['$implicit']
    | null
  >(null, { alias: 'context' });
  public $unit = input<string>('', { alias: 'unit' });
  public $asCellTemplate = input<boolean>(true, { alias: 'asCellTemplate' });
  public $inputField = input<string>('UnitName', { alias: 'field' });
  public $field = linkedSignal(() => this.$inputField());
  public $unitName = input<string | null>(null, { alias: 'unitName' });
  public $typeAmount = input.required<TYPE_AMOUNT_TYPES>({
    alias: 'typeAmount',
  });
  public $unitNameErrorShowError = input<{
    [key in TYPE_AMOUNT_TYPES]: (
      ctx:
        | ImperiaTableBodyCellTemplateContext<
            TItem,
            TImperiaTableColumnDataInfoTypes,
            TImperiaTableColumnDataInfoTypes
          >['$implicit']
        | null
        | string
    ) => boolean;
  }>(
    {
      [TYPE_AMOUNT_TYPES.Amount]: (
        ctx:
          | ImperiaTableBodyCellTemplateContext<
              TItem,
              TImperiaTableColumnDataInfoTypes,
              TImperiaTableColumnDataInfoTypes
            >['$implicit']
          | null
          | string
      ) =>
        typeof ctx === 'string'
          ? ctx === UNIT_CONVERSION_ERROR || ctx === CURRENCY_CONVERSION_ERROR
          : ctx
          ? ctx.row.data[ctx.col.field] === UNIT_CONVERSION_ERROR ||
            ctx.row.data[ctx.col.field] === CURRENCY_CONVERSION_ERROR
          : false,
      [TYPE_AMOUNT_TYPES.NetAmount]: (
        ctx:
          | ImperiaTableBodyCellTemplateContext<
              TItem,
              TImperiaTableColumnDataInfoTypes,
              TImperiaTableColumnDataInfoTypes
            >['$implicit']
          | null
          | string
      ) =>
        typeof ctx === 'string'
          ? ctx === CURRENCY_CONVERSION_ERROR || ctx === UNIT_CONVERSION_ERROR
          : ctx
          ? ctx.row.data[ctx.col.field] === CURRENCY_CONVERSION_ERROR ||
            ctx.row.data[ctx.col.field] === UNIT_CONVERSION_ERROR
          : false,
    },
    {
      alias: 'unitNameErrorShowError',
    }
  );
  public $unitNameErrorMessages = input<{
    [key in TYPE_AMOUNT_TYPES]: string;
  }>(this.unitNameErrorMessages, {
    alias: 'unitNameErrorMessages',
  });

  public $defaultUnit = input<{
    [key in TYPE_AMOUNT_TYPES]: string;
  }>(
    {
      [TYPE_AMOUNT_TYPES.Amount]: '',
      [TYPE_AMOUNT_TYPES.NetAmount]: CURRENCY_SYMBOL(),
    },
    {
      alias: 'defaultUnit',
    }
  );
  //#endregion INPUTS

  constructor() {
    this.setColumnHeaderEffect();
  }

  public setColumnHeaderEffect() {
    effect(() => {
      const column = this.columnDirective.$column() ?? this.column;
      const typeAmount = this.$typeAmount();
      const asCellTemplate = this.$asCellTemplate();
      if (!column || !asCellTemplate) return;
      this.setColumnHeader(column, typeAmount);
    });
  }

  public setColumn(col: ImperiaTableColumn<any>) {
    if (!!this.column) return;
    this.column = col;
  }

  public setColumnHeader(
    col: ImperiaTableColumn<any>,
    typeAmount: TYPE_AMOUNT_TYPES
  ) {
    col.setHeader(this.unitColumnHeaders[typeAmount]);
  }
}
