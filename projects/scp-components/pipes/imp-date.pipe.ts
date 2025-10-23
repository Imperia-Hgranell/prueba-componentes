import { Pipe, PipeTransform } from '@angular/core';
import { RANGE_TYPES } from '@imperiascm/scp-utils/models';
import moment from 'moment';

/**
 * This pipe must recive de date in UTC.
 */

@Pipe({
  name: 'impDate',
  standalone: true,
})
export class ImpDatePipe implements PipeTransform {
  private dateFormats = {
    [RANGE_TYPES.Days]: 'DD/MM/yyyy',
    [RANGE_TYPES.Weeks]: 'WW/yyyy',
    [RANGE_TYPES.Months]: 'MM/yyyy',
    [RANGE_TYPES.Years]: 'yyyy',
  };

  transform(
    date: Date | string | boolean | null,
    rangeType: RANGE_TYPES
  ): string | null {
    return date && typeof date !== 'boolean'
      ? moment(date).utc(false).format(this.dateFormats[rangeType])
      : '';
  }
}
