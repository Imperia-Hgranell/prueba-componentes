import { KeyValue } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import {
  containsDateAmountColField,
  entries,
} from '@imperiascm/scp-utils/functions';
import { DateAmountColField } from '@imperiascm/scp-utils/models';

@Pipe({
  name: 'containsColumnKeyValue',
  standalone: true,
})
export class ContainsColumnKeyValuePipe implements PipeTransform {
  transform(
    object: any
  ): object is Record<
    DateAmountColField,
    KeyValue<`${string}${DateAmountColField}${string}`, string>
  > {
    const key = entries(object)[0][0];
    return typeof key === 'string' && containsDateAmountColField(key);
  }
}
