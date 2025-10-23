import { TemplateRef } from '@angular/core';
import { ImperiaTableColumnsGroupsTemplateContext, TImperiaTableColumnsGroupOptionalProperties } from './imperia-table-columns-groups.types';
import { ImperiaTableColumn } from './imperia-table-columns.models';
import { TImperiaTableColumnStyle } from './imperia-table-columns.types';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  switchMap,
} from 'rxjs';

export interface IImperiaTableColumnsGroup<TItem extends object = any> {
  key: string;
  columns: ImperiaTableColumn<TItem>[];
  header: string;
  headerCellStyle: TImperiaTableColumnStyle;
  headerTextStyle: TImperiaTableColumnStyle;
  headerCellClass: string;
}

export class ImperiaTableColumnsGroup<TItem extends object = any> {
  headerCellClass: string;
  headerCellStyle: TImperiaTableColumnStyle;
  headerTextStyle: TImperiaTableColumnStyle;
  width$: Observable<string>;
  frozen: boolean;
  frozenPosition: 'left' | 'right';
  template: TemplateRef<ImperiaTableColumnsGroupsTemplateContext> | undefined;
  private columns$ = new BehaviorSubject<ImperiaTableColumn<any>[]>([]);

  constructor(
    public key: string,
    public columns: ImperiaTableColumn<TItem>[],
    public header: string = '',
    {
      headerCellStyle,
      headerTextStyle,
      headerCellClass,
    }: Partial<TImperiaTableColumnsGroupOptionalProperties<TItem>> = {}
  ) {
    this.columns$.next(columns);
    this.width$ = this.getWidth$Updated();

    this.headerCellStyle = headerCellStyle ?? {};
    this.headerTextStyle = headerTextStyle ?? {};
    this.headerCellClass = headerCellClass ?? '';
    this.frozen = this.columns.some((col) => col.frozen);
    this.frozenPosition = this.columns[0]?.frozenPosition ?? 'left';
  }
  public addColumn(column: ImperiaTableColumn<TItem>) {
    this.columns.push(column);
    this.columns$.next([...this.columns]);
  }

  private getWidth$Updated(): Observable<string> {
    return this.columns$.pipe(
      switchMap((columns) =>
        combineLatest(
          columns
            .filter(({ visible }) => visible)
            .map((col) => col.width$.pipe(map(() => col.width)))
        ).pipe(
          map(
            (widths) =>
              widths.reduce<number>(
                (totalWidth, width) =>
                  totalWidth + (typeof width === 'number' ? width : 0),
                0
              ) + 'px'
          )
        )
      )
    );
  }
}
