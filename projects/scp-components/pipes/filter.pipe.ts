import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filter', standalone: true })
export class FilterPipe implements PipeTransform {
  transform<TItem, TItemProperty extends keyof TItem>(
    array: TItem[],
    property: TItemProperty,
    value: TItem[TItemProperty],
    not: 'not' | null = null
  ): TItem[] {
    if (not) return array.filter((item) => item[property] !== value);
    else return array.filter((item) => item[property] === value);
  }
}
