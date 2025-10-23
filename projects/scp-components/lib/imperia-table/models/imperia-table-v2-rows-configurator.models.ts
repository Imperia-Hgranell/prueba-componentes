export interface RowsConfiguratorMoveEvent<TItem extends object> {
  direction: RowsConfiguratorMoveEventDirection;
  rows: RowsConfiguration<TItem>[];
}

export type RowsConfiguratorMoveEventDirection = 'up' | 'down';

export class RowsConfiguration<TItem extends object> {
  Item: TItem;
  Key: keyof TItem & string;
  Visible: boolean;
  DefaultConfig?: { Visible: boolean };

  get keyValue() {
    return this.Item[this.Key];
  }

  set visible(value: boolean) {
    this.Visible = value;
  }

  constructor(Key: keyof TItem & string, Item: TItem, Visible?: boolean) {
    this.Key = Key;
    this.Item = Item;
    this.Visible = Visible ?? true;
    this.DefaultConfig = { Visible: Visible ?? true };
  }

  public withDefaultConfig() {
    return new RowsConfiguration(
      this.Key,
      this.Item,
      this.DefaultConfig?.Visible,
    );
  }
}
