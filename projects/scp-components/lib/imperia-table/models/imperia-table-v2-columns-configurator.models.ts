import { ImperiaTableColumn } from './imperia-table-columns.models';

export interface ColumnsConfiguratorMoveEvent<TItem extends object> {
  direction: ColumnsConfiguratorMoveEventDirection;
  columns: ImperiaTableColumn<TItem>[];
}

export type ColumnsConfiguratorMoveEventDirection = 'up' | 'down';

export class ColumnConfiguration {
  field: string;
  frozen: boolean;
  frozenPosition: 'left' | 'right';
  visible: boolean;

  constructor(
    field: string,
    frozen: boolean,
    frozenPosition: 'left' | 'right',
    visible: boolean,
  ) {
    this.field = field;
    this.frozen = frozen;
    this.frozenPosition = frozenPosition;
    this.visible = visible;
  }
}
