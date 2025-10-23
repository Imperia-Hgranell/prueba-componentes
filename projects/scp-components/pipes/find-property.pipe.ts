import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'findProperty',
  standalone: true,
})
export class FindPropertyPipe implements PipeTransform {
  transform<TItem extends object, TReturnKey extends keyof TItem>(
    items: TItem[] | null,
    searchKey: keyof TItem,
    searchValue: TItem[keyof TItem],
    returnKey: TReturnKey
  ): TItem[TReturnKey] | null {
    if (!items || !searchKey || !returnKey) return null;
    const item = items.find((item) => item[searchKey] === searchValue)?.[
      returnKey
    ];

    if (item === undefined || item === null) {
      return null;
    }
    return item;
  }
}
