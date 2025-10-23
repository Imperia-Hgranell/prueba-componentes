import { Pipe, PipeTransform } from '@angular/core';
import { entriesOf } from '@imperiascm/scp-utils';
import { entries } from '@imperiascm/scp-utils/functions';

@Pipe({
  name: 'entries',
  standalone: true,
})
export class EntriesPipe implements PipeTransform {
  transform<TItem extends object>(object: TItem): entriesOf<TItem> {
    return entries(object);
  }
}
