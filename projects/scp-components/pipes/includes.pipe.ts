import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'includes',
  standalone: true,
})
export class IncludesPipe<TItem> implements PipeTransform {
  transform(value: TItem[], key: any): boolean {
    const valueItemsAreObjects = value.every(
      (item) => typeof item === 'object' && item !== null
    );
    if (valueItemsAreObjects) {
      return value.some(
        (item) => (item as { [key: string]: any })[key] !== undefined
      );
    }

    return value.some((item) => item === key);
  }
}
