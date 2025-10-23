import { Pipe, PipeTransform } from '@angular/core';
import { Filter } from '@imperiascm/scp-utils/payload';

@Pipe({
  name: 'isFilterSelected',
  standalone: true,
})
export class IsFilterSelectedPipe implements PipeTransform {
  transform(
    value: Map<string, Filter> | null,
    colFilterName: string,
    isSelectedFn: ((filter: Filter, ColumnFilterName: string) => boolean) | null
  ): boolean {
    if (!value || !isSelectedFn) return false;
    return Array.from(value.values()).some(
      (filter) => filter.Value && isSelectedFn(filter, colFilterName)
    );
  }
}
