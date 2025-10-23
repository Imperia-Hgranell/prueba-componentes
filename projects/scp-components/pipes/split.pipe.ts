import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'split',
  standalone: true,
})
/**
 * Pipe to split a string into an array based on a given separator.
 * If the string is empty or contains only a semicolon, it returns null.
 */
export class SplitPipe implements PipeTransform {
  transform(
    value: string,
    separator: string,
    returnAsNull: boolean = false,
  ): string[] | null {
    if (value.replace(separator, '') === '') {
      return returnAsNull ? null : [];
    }
    return value.split(separator);
  }
}
