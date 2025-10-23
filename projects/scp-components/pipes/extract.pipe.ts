import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'extract',
  standalone: true,
})

/**
 * Extracts a specific property from an array of objects.
 * @example
 * ```html
 * <div *ngFor="let item of items | extract: 'name'">
 *  {{ item }}
 * </div>
 * ```
 * @param value The array of objects to extract the property from.
 * @param key The property key to extract.
 * @returns An array of the extracted property values.
 */
export class ExtractPipe<TItem extends object> implements PipeTransform {
  transform(value: TItem[], key: keyof TItem): TItem[keyof TItem][] {
    return value.map((item) => item[key]);
  }
}
