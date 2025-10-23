import { TImperiaTableColumnField } from './imperia-table-columns.types';
import { ImperiaTableFilterValue } from './imperia-table-filters.models';

/**
 * Este tipo contiene las propiedades requeridas para crear una vista de la tabla.
 * No usar para declarar vistas, si se quiere declarar una vista o array de vistas se debe usar `new ImperiaTableFilterView()`
 */
type TImperiaTableFilterViewRequiredProperties<TItem extends object> = Omit<
  ImperiaTableFilterView<TItem>,
  'changingName' | 'defaultView'
>;

/**
 * Este tipo contiene las propiedades de la vista que `NO` son requeridas o que tienen valores por defecto
 * - No usar para declarar vistas, si se quiere declarar una vista o array de vistas se debe usar `new ImperiaTableFilterView()`
 */
type TImperiaTableFilterViewOptionalProperties<TItem extends object> = Omit<
  ImperiaTableFilterView<TItem>,
  'id' | 'name' | 'fields' | 'changingName'
>;

/**
 * Este tipo contiene todas las propiedades de la vista, sean requeridas o no
 * - No usar para declarar vistas, si se quiere declarar una vista o array de vistas se debe usar `new ImperiaTableFilterView()`
 */
export type TImperiaTableFilterViewProperties<TItem extends object> =
  TImperiaTableFilterViewRequiredProperties<TItem> &
    Partial<TImperiaTableFilterViewOptionalProperties<TItem>>;

export class ImperiaTableFilterView<TItem extends object> {
  id: number;
  name: string;
  fields: ImperiaTableFilterValue<TItem, TImperiaTableColumnField<TItem>>[];
  changingName: boolean;
  defaultView: boolean;

  constructor(
    id: number,
    name: string,
    fields: ImperiaTableFilterValue<
      TItem,
      TImperiaTableColumnField<TItem>
    >[] = [],
    {
      defaultView,
    }: Partial<TImperiaTableFilterViewOptionalProperties<TItem>> = {},
  ) {
    this.id = id;
    this.name = name;
    this.fields = fields;
    this.changingName = false;
    this.defaultView = defaultView ?? false;
  }
}

export const IMPERIA_TABLE_DEFAULT_VIEW = new ImperiaTableFilterView(
  0,
  'Todos',
  [],
  {
    defaultView: true,
  },
);
