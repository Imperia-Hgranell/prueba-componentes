import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Injector,
  Input,
  QueryList,
  TemplateRef,
  viewChildren,
  ViewChildren,
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  ReplaySubject,
  shareReplay,
  tap,
} from 'rxjs';
import {
  IMPERIA_TABLE_V3_COLUMN_GROUPS_PROVIDER,
  IMPERIA_TABLE_V3_COLUMNS_PROVIDER,
} from '../../imperia-table-v3-columns-provider';
import { DateAmountColField, RANGE_TYPES } from '@imperiascm/scp-utils/models';
import { ImperiaTableV3ColumnsProvider } from '../../interfaces/imperia-table-v3-columns-provider';
import {
  containsDateAmountColField,
  DateAmountColumnsGroupsRecord,
  entries,
} from '@imperiascm/scp-utils/functions';
import { ImperiaTableBodyCellTemplateDirective } from '../../../imperia-table/template-directives/imperia-table-body-cell-template.directive';
import { ImperiaTableCellTemplateContext } from '../../../imperia-table/models/imperia-table-cells.types';
import { ImperiaTableV2ColumnDirective } from '../../../imperia-table/directives/imperia-table-v2-column.directive';
import { ImperiaTableV3ColumnsGroupDirective } from '../../directives/imperia-table-v3-columns-group-directive.directive';
import { TImperiaTableColumnProperties } from '../../../imperia-table/models/imperia-table-columns.types';

@Component({
  selector: 'imperia-table-v3-columns-groups',
  providers: [
    {
      provide: IMPERIA_TABLE_V3_COLUMN_GROUPS_PROVIDER,
      useExisting: ImperiaTableV3ColumnsGroupsComponent,
    },
    {
      provide: IMPERIA_TABLE_V3_COLUMNS_PROVIDER,
      useExisting: ImperiaTableV3ColumnsGroupsComponent,
    },
  ],
  templateUrl: './imperia-table-v3-columns-groups.component.html',
  styleUrls: ['./imperia-table-v3-columns-groups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV3ColumnsGroupsComponent<
  TItem extends object,
  TRangeType extends RANGE_TYPES = RANGE_TYPES
> implements ImperiaTableV3ColumnsProvider<any>
{
  public dateAmountColumnsRecord = new ReplaySubject<
    DateAmountColumnsGroupsRecord<TRangeType>
  >(1);
  @Input('data') set recordSetter(
    v: DateAmountColumnsGroupsRecord<TRangeType> | null
  ) {
    if (!v) return;
    this.dateAmountColumnsRecord.next(v);
  }

  public columnsConfigurationFn = new BehaviorSubject<
    (
      v: KeyValue<`${string}${DateAmountColField}${string}`, string>
    ) => TImperiaTableColumnProperties<any>
  >((v) => ({
    field: v.key,
    header: v.value,
    dataInfo: { type: 'number', readonly: true },
    width: 100,
    allowFilter: false,
    sortable: false,
  }));
  @Input('columnsConfigurationFn') set columnsConfigurationSetter(
    v: (
      v: KeyValue<`${string}${DateAmountColField}${string}`, string>
    ) => TImperiaTableColumnProperties<any>
  ) {
    if (!v) return;
    this.columnsConfigurationFn.next(v);
  }

  @ViewChildren(ImperiaTableV3ColumnsGroupDirective) set columnsGroupsSetter(
    v: QueryList<ImperiaTableV3ColumnsGroupDirective<TItem>> | null
  ) {
    if (!v) return;
    this.columnsGroups.next(v);
  }
  public columnsGroups = new ReplaySubject<
    QueryList<ImperiaTableV3ColumnsGroupDirective<TItem>>
  >(1);

  public $columns = viewChildren(ImperiaTableV2ColumnDirective);

  public bodyColumnTemplate$ = new ReplaySubject<
    TemplateRef<ImperiaTableCellTemplateContext<TItem>>
  >(1);
  @ContentChild(ImperiaTableBodyCellTemplateDirective)
  set bodyColumnTemplateSetter(
    v: ImperiaTableBodyCellTemplateDirective<TItem> | null
  ) {
    if (!v) return;
    this.bodyColumnTemplate$.next(v.template);
  }

  //#region RECORD
  public record$: Observable<
    DateAmountColumnsGroupsRecord<
      TRangeType,
      TImperiaTableColumnProperties<any>
    >
  > = combineLatest([
    this.dateAmountColumnsRecord,
    this.columnsConfigurationFn,
  ]).pipe(
    tap(([dateAmountColumnsRecord, columnsConfigurationFn]) =>
      this.reduceRecordToSetColumnProperties(
        dateAmountColumnsRecord,
        columnsConfigurationFn
      )
    ),
    map(([dateAmountColumnsRecord]) => dateAmountColumnsRecord as any),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private reduceRecordToSetColumnProperties(
    dateAmountColumnsRecord: DateAmountColumnsGroupsRecord<TRangeType>,
    columnsConfigurationFn: (
      v: KeyValue<`${string}${DateAmountColField}${string}`, string>
    ) => TImperiaTableColumnProperties<any>
  ) {
    entries(dateAmountColumnsRecord).forEach(([Key, Value]) => {
      if (
        typeof Value.key === 'string' &&
        containsDateAmountColField(Value.key)
      ) {
        dateAmountColumnsRecord[Key] = columnsConfigurationFn(
          Value as any
        ) as any;
      } else {
        this.reduceRecordToSetColumnProperties(
          Value as any,
          columnsConfigurationFn
        );
      }
    });
  }
  //#endregion RECORD

  constructor() {}

  public columnGroupInjector(params: {
    columnGroup: ImperiaTableV3ColumnsGroupDirective<TItem>;
  }) {
    return {
      providers: [],
      parent: Injector.create({
        providers: [
          {
            provide: ImperiaTableV3ColumnsGroupDirective,
            useValue: params.columnGroup,
          },
        ],
      }),
    };
  }
}
