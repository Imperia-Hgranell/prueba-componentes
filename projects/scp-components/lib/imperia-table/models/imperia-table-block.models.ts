export type ImperiaTableBlockFromInternal = 'paste';

type ImperiaTableBlockFrom<TState extends boolean> = TState extends true
  ? ImperiaTableBlockFromInternal | 'outside'
  : never;

type ImperiaTableBlockMsg<
  TState extends boolean,
  TFrom extends ImperiaTableBlockFrom<TState>,
> = TFrom extends 'outside' ? string : never;

export class ImperiaTableBlock<
  TState extends boolean = boolean,
  TFrom extends ImperiaTableBlockFrom<TState> = ImperiaTableBlockFrom<TState>,
> {
  state: TState;
  from?: TFrom;
  msg?: ImperiaTableBlockMsg<TState, TFrom>;

  constructor(blocked: Partial<ImperiaTableBlock<TState, TFrom>> | TState) {
    if (typeof blocked === 'boolean') {
      this.state = blocked;
      this.from = this.state ? ('outside' as TFrom) : undefined;
    } else if (!!blocked.state) {
      this.state = blocked.state;
      this.from = blocked.from ?? ('outside' as TFrom);
      this.msg = this.from == 'outside' ? blocked.msg : undefined;
    } else {
      this.state = false as TState;
      this.from = undefined;
      this.msg = undefined;
    }
  }
}
