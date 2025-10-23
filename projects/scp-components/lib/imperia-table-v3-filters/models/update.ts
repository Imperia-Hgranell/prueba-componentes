import { Filter } from '@imperiascm/scp-utils/payload';

export type UpdateOrRemoveFilter = Pick<Filter, 'Column'> & Partial<Filter>;

export type UpdateParams = {
  update: UpdateOrRemoveFilter[];
  remove: UpdateOrRemoveFilter[];
};

export type UpdateFn = (params: Partial<UpdateParams>) => void;
