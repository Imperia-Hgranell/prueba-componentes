import { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';
import { UpdateFn } from './update';

export type OnRemoveFn<TItem extends object> = (
  removed: string,
  update: UpdateFn,
  selectedFilters: ImperiaTableColumn<TItem>[]
) => void;
