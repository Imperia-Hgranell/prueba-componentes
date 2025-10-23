import { IImperiaTableColumnsGroup, ImperiaTableColumnsGroup } from './imperia-table-columns-groups.models';

export type TImperiaTableColumnsGroupRequiredProperties<TItem extends object> =
  Pick<IImperiaTableColumnsGroup<TItem>, 'key' | 'header' | 'columns'>;

export type TImperiaTableColumnsGroupOptionalProperties<TItem extends object> =
  Partial<
    Pick<
      IImperiaTableColumnsGroup<TItem>,
      'headerCellStyle' | 'headerTextStyle' | 'headerCellClass'
    >
  >;

export type TImperiaTableColumnsGroupProperties<TItem extends object> =
  TImperiaTableColumnsGroupRequiredProperties<TItem> &
    TImperiaTableColumnsGroupOptionalProperties<TItem>;

export type TImperiaTableColumnsGroupTranslation = {
  header: string;
};

export type TImperiaTableColumnsGroupsTranslation = Partial<{
  [key: string]: TImperiaTableColumnsGroupTranslation;
}>;

export interface ImperiaTableColumnsGroupsTemplateContext<
  TItem extends object = any
> {
  $implicit: ImperiaTableColumnsGroup<TItem>;
  index: number;
}
