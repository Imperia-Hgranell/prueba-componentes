import { DecimalPipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { LOCALE } from '@imperiascm/scp-utils/functions';

@Pipe({
  name: 'shortNumber',
  standalone: true,
})
export class ShortNumberPipe implements PipeTransform {
  decimalPipe = inject(DecimalPipe);

  transform(number: number, digitsInfo?: string): any {
    if (isNaN(number)) return null;
    if (number === null) return null;
    if (number === 0) return 0;
    let abs = Math.abs(number);
    const isNegative = number < 0;
    let key = '';

    const powers = [
      { key: 'Q', value: Math.pow(10, 15) },
      { key: 'T', value: Math.pow(10, 12) },
      { key: 'B', value: Math.pow(10, 9) },
      { key: 'M', value: Math.pow(10, 6) },
      { key: 'K', value: 1000 },
    ];

    for (let i = 0; i < powers.length; i++) {
      let reduced = abs / powers[i].value;
      if (reduced >= 1) {
        abs = reduced;
        key = powers[i].key;
        break;
      }
    }
    return (
      (isNegative ? '-' : '') +
      this.decimalPipe.transform(abs, digitsInfo, LOCALE()) +
      key
    );
  }
}
