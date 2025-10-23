import { ImperiaTableFilterValue } from '../../imperia-table/models/imperia-table-filters.models';
import { ImperiaTableScrollValue } from '../../imperia-table/models/imperia-table-outputs.models';

export interface IImpInputHelpSearchScrollEvent {
  Search?: string;
  Pagination?: Partial<ImperiaTableScrollValue>;
  Filters?: ImperiaTableFilterValue<any, string>[];
}

export class ImpInputHelpSearchScrollEvent {
  Search: string;
  Pagination: ImperiaTableScrollValue;
  Filters: ImperiaTableFilterValue<any, string>[] = [];
  constructor(props: Partial<IImpInputHelpSearchScrollEvent> = {}) {
    this.Search = props.Search ?? '';
    this.Pagination = { Page: 1, Size: 100, ...props.Pagination };
    this.Filters = props.Filters ?? [];
  }
}

export type ImpInputHelpWriteValueProps<
  TValue = any,
  TAllowMultipleValues extends boolean | undefined = undefined
> = {
  value: TValue;
  isArray: boolean;
  isEmptyArray: boolean;
  isObjectsArray: boolean;
  isStringsArray: boolean;
  isObject: boolean;
  isString: boolean;
  isNumber: boolean;
  isInvalid: boolean;
} & (TAllowMultipleValues extends undefined
  ? Record<string, never>
  : { allowMultipleValues: TAllowMultipleValues });

export type ImpInputHelpV2Option<TItem> = TItem & {
  value: TItem;
  label: TItem extends object ? TItem[keyof TItem] : TItem;
  selected: boolean;
};
