import { Directive, Input, TemplateRef } from '@angular/core';
import { IMPERIA_TABLE_BODY_CELL_TEMPLATES_PROVIDER } from '../../imperia-table-v3/imperia-table-body-cell-templates-provider';
import { ImperiaTableCell } from '../models/imperia-table-cells.models';
import { ImperiaTableColumn } from '../models/imperia-table-columns.models';
import { TImperiaTableColumnDataInfoTypes, TImperiaTableColumnField } from '../models/imperia-table-columns.types';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';
import { Observable } from 'rxjs';

type DataInfoTypesToUnion<
  T extends
    | TImperiaTableColumnDataInfoTypes
    | TImperiaTableColumnDataInfoTypes[]
> = T extends TImperiaTableColumnDataInfoTypes[] ? T[number] : T;

export type ImperiaTableBodyCellTemplateContext<
  TItem extends object = any,
  TColDataInfoType extends
    | TImperiaTableColumnDataInfoTypes
    | TImperiaTableColumnDataInfoTypes[] = TImperiaTableColumnDataInfoTypes,
  TCellDataInfoType extends
    | TImperiaTableColumnDataInfoTypes
    | TImperiaTableColumnDataInfoTypes[] = any
> = {
  $implicit: {
    col: ImperiaTableColumn<TItem, DataInfoTypesToUnion<TColDataInfoType>>;
    colIndex: number;
    row: ImperiaTableRow<TItem>;
    rowIndex: number;
    cell: ImperiaTableCell<
      TItem,
      TImperiaTableColumnField<TItem>,
      DataInfoTypesToUnion<TCellDataInfoType>
    >;
    selected: boolean;
    isLastClicked: boolean;
    atFooter: boolean;
    editMode: boolean;
    isLastFrozenLeft?: boolean;
    isLastUnfrozen?: boolean;
    isFirstFrozenRight?: boolean;
    frozenColumnsOverflow?: boolean;
    position$: Observable<string>;
  };
};

@Directive({
  selector: '[imperiaTableBodyCell]',
  providers: [
    {
      provide: IMPERIA_TABLE_BODY_CELL_TEMPLATES_PROVIDER,
      useExisting: ImperiaTableBodyCellTemplateDirective,
    },
  ],
  standalone: true,
})
export class ImperiaTableBodyCellTemplateDirective<
  TItem extends object,
  TColDataInfoType extends
    | TImperiaTableColumnDataInfoTypes
    | TImperiaTableColumnDataInfoTypes[] = TImperiaTableColumnDataInfoTypes,
  TCellDataInfoType extends
    | TImperiaTableColumnDataInfoTypes
    | TImperiaTableColumnDataInfoTypes[] = TColDataInfoType
> {
  @Input('imperiaTableBodyCell')
  field!: string;
  @Input() colDataInfoType!: TColDataInfoType;
  @Input() cellDataInfoType!: TCellDataInfoType;

  constructor(
    public template: TemplateRef<
      ImperiaTableBodyCellTemplateContext<
        TItem,
        TColDataInfoType,
        TCellDataInfoType
      >
    >
  ) {}

  static ngTemplateContextGuard<
    TItem extends object,
    TColDataInfoType extends
      | TImperiaTableColumnDataInfoTypes
      | TImperiaTableColumnDataInfoTypes[] = TImperiaTableColumnDataInfoTypes,
    TCellDataInfoType extends
      | TImperiaTableColumnDataInfoTypes
      | TImperiaTableColumnDataInfoTypes[] = TColDataInfoType
  >(
    directive: ImperiaTableBodyCellTemplateDirective<
      TItem,
      TColDataInfoType,
      TCellDataInfoType
    >,
    context: unknown
  ): context is ImperiaTableBodyCellTemplateContext<
    TItem,
    TColDataInfoType,
    TCellDataInfoType
  > {
    return true;
  }

  static ['ngTemplateGuard_impTableColumnBodyCell']<
    TItem extends object,
    TColDataInfoType extends
      | TImperiaTableColumnDataInfoTypes
      | TImperiaTableColumnDataInfoTypes[] = TImperiaTableColumnDataInfoTypes,
    TCellDataInfoType extends
      | TImperiaTableColumnDataInfoTypes
      | TImperiaTableColumnDataInfoTypes[] = TColDataInfoType
  >(
    dir: ImperiaTableBodyCellTemplateDirective<
      TItem,
      TColDataInfoType,
      TCellDataInfoType
    >,
    field: string
  ): field is string {
    return true;
  }

  static ['ngTemplateGuard_colDataInfoType']<
    TItem extends object,
    TColDataInfoType extends
      | TImperiaTableColumnDataInfoTypes
      | TImperiaTableColumnDataInfoTypes[] = TImperiaTableColumnDataInfoTypes,
    TCellDataInfoType extends
      | TImperiaTableColumnDataInfoTypes
      | TImperiaTableColumnDataInfoTypes[] = TColDataInfoType
  >(
    dir: ImperiaTableBodyCellTemplateDirective<
      TItem,
      TColDataInfoType,
      TCellDataInfoType
    >,
    colDataInfoType: TColDataInfoType
  ): colDataInfoType is TColDataInfoType {
    return true;
  }

  static ['ngTemplateGuard_cellDataInfoType']<
    TItem extends object,
    TColDataInfoType extends
      | TImperiaTableColumnDataInfoTypes
      | TImperiaTableColumnDataInfoTypes[] = TImperiaTableColumnDataInfoTypes,
    TCellDataInfoType extends
      | TImperiaTableColumnDataInfoTypes
      | TImperiaTableColumnDataInfoTypes[] = TColDataInfoType
  >(
    dir: ImperiaTableBodyCellTemplateDirective<
      TItem,
      TColDataInfoType,
      TCellDataInfoType
    >,
    cellDataInfoType: TCellDataInfoType
  ): cellDataInfoType is TCellDataInfoType {
    return true;
  }
}
