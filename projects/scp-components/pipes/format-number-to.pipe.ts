import { DecimalPipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { LOCALE } from '@imperiascm/scp-utils/functions';

export const INFINITE_NUMBER = 1.7976931348623157e308;
export const isInfiniteNumber = (value: number | string | null): boolean =>
  value == INFINITE_NUMBER;

@Pipe({
  name: 'formatNumberTo',
  standalone: true,
})
export class FormatNumberToPipe implements PipeTransform {
  private readonly locale = LOCALE();
  private readonly decimalPipe = inject(DecimalPipe);

  transform(
    value: number | string | null,
    places: {
      integer: number | string | null;
      minDecimals: number | string | null;
      maxDecimals?: number | string | null;
    }
  ): string | null {
    const { integer, minDecimals, maxDecimals } = places;

    if (integer === null || minDecimals === null) {
      return value?.toString() || null;
    } else if (isInfiniteNumber(value)) {
      return '∞';
    } else {
      return this.decimalPipe.transform(
        value || 0,
        `${integer}.${minDecimals}-${maxDecimals ?? minDecimals}`,
        this.locale
      );
    }
  }
}
