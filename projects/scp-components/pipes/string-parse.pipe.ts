import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stringParse',
  standalone: true,
})
export class StringParsePipe<TItem extends object> implements PipeTransform {
  transform(value: TItem[], property: keyof TItem): TItem[] {
    if (!value || !property) return value;
    return value.map((item) => ({ ...item, [property]: item[property] + '' }));
  }
}
