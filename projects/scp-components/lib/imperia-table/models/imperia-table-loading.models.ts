export type ImperiaTableLoadingFromInternal =
  | 'pageChanges'
  | 'searchChanges'
  | 'filtersChanges'
  | 'columnSortChanges'
  | 'deleteChanges'
  | 'startWith';

type ImperiaTableLoadingAt<TState extends boolean> = TState extends true
  ? 'top' | 'bottom'
  : never;

type ImperiaTableLoadingFrom<TState extends boolean> = TState extends true
  ? ImperiaTableLoadingFromInternal | 'outside'
  : never;

type ImperiaTableLoadingMsg<
  TState extends boolean,
  TFrom extends ImperiaTableLoadingFrom<TState>,
> = TFrom extends 'outside' ? string : never;

export class ImperiaTableLoading<
  TState extends boolean = boolean,
  TFrom extends
    ImperiaTableLoadingFrom<TState> = ImperiaTableLoadingFrom<TState>,
> {
  state: TState;
  at?: ImperiaTableLoadingAt<TState>;
  from?: TFrom;
  msg?: ImperiaTableLoadingMsg<TState, TFrom>;

  constructor(loading: Partial<ImperiaTableLoading<TState, TFrom>> | TState) {
    if (typeof loading === 'boolean') {
      this.state = loading;
      this.at = this.state
        ? ('top' as ImperiaTableLoadingAt<TState>)
        : undefined;
    } else if (!!loading.state) {
      this.state = loading.state;
      this.at = loading.at ?? ('top' as ImperiaTableLoadingAt<TState>);
      this.from = loading.from ?? ('outside' as TFrom);
      this.msg = this.from == 'outside' ? loading.msg : undefined;
    } else {
      this.state = false as TState;
      this.at = undefined;
      this.from = undefined;
      this.msg = undefined;
    }
  }
}
