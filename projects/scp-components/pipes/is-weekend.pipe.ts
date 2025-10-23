import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

@Pipe({
  name: 'isWeekend',
})
export class IsWeekendPipe implements PipeTransform {
  transform(value: Date | null): boolean {
    if (!value) {
      return false;
    }
    return moment(value).get('day') === 0 || moment(value).get('day') === 6;
  }
}
