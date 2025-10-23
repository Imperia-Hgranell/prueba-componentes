import { Directive, input, TemplateRef } from '@angular/core';
import { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';
import { TImperiaTableColumnDataInfoTypes } from '../../imperia-table/models/imperia-table-columns.types';
import { UpdateFn } from '../models/update';
import { Filter } from '@imperiascm/scp-utils/payload';

export type ImperiaTableV3FilterTemplateContext<TItem extends object> = {
  $implicit: {
    update: UpdateFn;
    filter: ImperiaTableColumn<TItem, TImperiaTableColumnDataInfoTypes>;
    selected: {
      filters: ImperiaTableColumn<TItem, TImperiaTableColumnDataInfoTypes>[];
      values: Map<string, Filter>;
      hierarchy: Filter[];
    };
  };
};

@Directive({
  selector: '[imperia-table-v3-filter-template]',
  standalone: true,
})
export class ImperiaTableV3FilterTemplateContextDirective<
  TItem extends object
> {
  public type = input.required<'filter' | 'config'>({
    alias: 'imperia-table-v3-filter-template',
  });

  constructor(
    public template: TemplateRef<ImperiaTableV3FilterTemplateContext<TItem>>
  ) {}

  static ngTemplateContextGuard<TItem extends object>(
    directive: ImperiaTableV3FilterTemplateContextDirective<TItem>,
    context: unknown
  ): context is ImperiaTableV3FilterTemplateContext<TItem> {
    return true;
  }
}
