export interface ResultDeletionParams {
  withDialog?: boolean;
}

export interface CancelDeletionParams {
  withDialog?: boolean;
}

export interface ImperiaTableV2DeletionEvent<TItem extends object> {
  selection: TItem[];
  result: (result: boolean, params?: ResultDeletionParams) => void;
  cancel: (params?: CancelDeletionParams) => void;
}
