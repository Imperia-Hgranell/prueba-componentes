import { inject, Pipe, PipeTransform } from '@angular/core';
import { ImpTranslateService } from '@imperiascm/translate';
import { timeTypeToString } from '@imperiascm/scp-utils/payload';
import { TIME_TYPES } from '../models/imp-time-type.models';

@Pipe({
  name: 'timeToString',
  standalone: true,
})
export class TimeTypeToStringPipe implements PipeTransform {
  private typedTranslateService = inject(ImpTranslateService);
  transform(value: TIME_TYPES | null): string {
    if (value === null) return '';
    return timeTypeToString(value, this.typedTranslateService as any);
  }
}
