import { ContentChild, Directive, Input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { withValueFrom } from '@imperiascm/rxjs-utils';
import { IMPERIA_TABLE_V3_COLUMNS_PROVIDER } from '../../imperia-table-v3/imperia-table-v3-columns-provider';
import { TIImperiaTableColumnDataInfoType, TImperiaTableColumnDataInfoTypes, TImperiaTableColumnField, TImperiaTableColumnOptionalProperties, TImperiaTableColumnProperties, TImperiaTableColumnTranslation } from '../models/imperia-table-columns.types';
import { IMPERIA_TABLE_BODY_CELL_TEMPLATES_PROVIDER } from '../../imperia-table-v3/imperia-table-body-cell-templates-provider';
import { ImpUnitNameComponent } from '../../imp-unit-name/imp-unit-name.component';
import { getImperiaTableColumn } from '../shared/functions';
import { ImperiaTableBodyCellTemplateDirective } from '../template-directives/imperia-table-body-cell-template.directive';
import { ImperiaTableHeaderCellTemplateDirective } from '../template-directives/imperia-table-header-cell-template.directive';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  combineLatest,
  map,
  shareReplay,
} from 'rxjs';

@Directive({
  selector: 'imperia-table-v2-column',
  standalone: true,
  providers: [
    {
      provide: IMPERIA_TABLE_V3_COLUMNS_PROVIDER,
      useExisting: ImperiaTableV2ColumnDirective,
    },
  ],
})
export class ImperiaTableV2ColumnDirective<
  TItem extends object,
  TDataInfoType extends TImperiaTableColumnDataInfoTypes = TImperiaTableColumnDataInfoTypes
> {
  //#region INPUTS
  public field = new ReplaySubject<TImperiaTableColumnField<TItem>>(1);
  @Input('field') set fieldSetter(v: TImperiaTableColumnField<TItem> | null) {
    if (!v) return;
    this.field.next(v);
  }
  public header = new BehaviorSubject<string>('');
  @Input('header') set headerSetter(v: string | null) {
    if (!v) return;
    this.header.next(v);
  }
  public width = new ReplaySubject<number | 'auto'>(1);
  @Input('width') set widthSetter(v: number | 'auto' | null) {
    if (v === null) return;
    this.width.next(v);
  }
  public dataInfo = new ReplaySubject<
    TIImperiaTableColumnDataInfoType<TDataInfoType>
  >(1);
  @Input('dataInfo') set dataInfoSetter(
    v: TIImperiaTableColumnDataInfoType<TDataInfoType> | null
  ) {
    if (!v) return;
    this.dataInfo.next(v);
  }
  public optionalColumnProperties = new BehaviorSubject<
    TImperiaTableColumnOptionalProperties<TItem>
  >({});
  @Input('optionalColumnProperties') set optionalColumnPropertiesSetter(
    v: TImperiaTableColumnOptionalProperties<TItem> | null
  ) {
    if (!v) return;
    this.optionalColumnProperties.next(v);
  }

  public translation =
    new BehaviorSubject<TImperiaTableColumnTranslation | null>(null);
  @Input('translation') set translationSetter(
    v: TImperiaTableColumnTranslation | null
  ) {
    if (!v) return;
    this.translation.next(v);
  }

  public bodyColumnTemplate = new ReplaySubject<
    | ImperiaTableBodyCellTemplateDirective<TItem>
    | ImpUnitNameComponent<TItem>
    | null
  >(1);
  @ContentChild(IMPERIA_TABLE_BODY_CELL_TEMPLATES_PROVIDER)
  set bodyColumnTemplateSetter(
    v:
      | ImperiaTableBodyCellTemplateDirective<TItem>
      | ImpUnitNameComponent<TItem>
      | null
  ) {
    this.bodyColumnTemplate.next(v);
  }

  public headerColumnTemplate =
    new ReplaySubject<ImperiaTableHeaderCellTemplateDirective<TItem> | null>(1);
  @ContentChild(ImperiaTableHeaderCellTemplateDirective)
  set headerColumnTemplateSetter(
    v: ImperiaTableHeaderCellTemplateDirective<TItem> | null
  ) {
    this.headerColumnTemplate.next(v);
  }
  //#endregion INPUTS

  //#region COLUMN TEMPLATES
  public bodyColumnTemplate$: Observable<
    | ImperiaTableBodyCellTemplateDirective<TItem>
    | ImpUnitNameComponent<TItem>
    | null
  > = combineLatest([this.field, this.bodyColumnTemplate]).pipe(
    map(([field, template]) => {
      if (!template) return null;

      template instanceof ImpUnitNameComponent
        ? template.$field.set(field)
        : (template.field = field);
      return template;
    })
  );

  public headerColumnTemplate$: Observable<
    | ImperiaTableHeaderCellTemplateDirective<TItem>
    | ImpUnitNameComponent<TItem>
    | null
  > = combineLatest([this.field, this.headerColumnTemplate]).pipe(
    map(([field, template]) => {
      if (!template) return null;
      template.field = field;
      return template;
    })
  );
  //#endregion COLUMN TEMPLATES

  //#region COLUMN PROPERTIES
  public columnsProperties$: Observable<TImperiaTableColumnProperties<TItem>> =
    combineLatest([
      this.field,
      this.header,
      this.dataInfo,
      this.width,
      this.optionalColumnProperties,
    ]).pipe(
      map(([field, header, dataInfo, width, optionalColumnProperties]) => ({
        field,
        header,
        dataInfo,
        width,
        ...optionalColumnProperties,
      }))
    );
  //#endregion COLUMN PROPERTIES

  //#region COLUMN
  public column$ = combineLatest([
    this.columnsProperties$,
    this.translation,
  ]).pipe(
    map(([columnProperties, translation]) =>
      getImperiaTableColumn(
        columnProperties,
        translation ?? {
          header: columnProperties.header,
          label: columnProperties.label,
        }
      )
    ),
    withValueFrom(this.bodyColumnTemplate, this.headerColumnTemplate),
    map(([column, bodyColumnTemplate, headerColumnTemplate]) => {
      if (bodyColumnTemplate)
        column.bodyCellTemplate =
          bodyColumnTemplate instanceof ImpUnitNameComponent
            ? bodyColumnTemplate.$template()
            : bodyColumnTemplate.template;
      if (headerColumnTemplate)
        column.headerCellTemplate = headerColumnTemplate.template;
      return column;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public $column = toSignal(this.column$);
  //#endregion COLUMN
}
