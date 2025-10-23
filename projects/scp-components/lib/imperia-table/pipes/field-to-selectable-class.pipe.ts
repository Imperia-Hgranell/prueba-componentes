import { Pipe, PipeTransform } from '@angular/core';

export function fieldToImperiaTableColumnClass(
  field: string,
  withPrefix: boolean = true,
): string {
  return `${withPrefix ? 'imperia-table-column-' : ''}${field
    .replace(/:/g, '-')
    .replace(/\./g, '-')
    .replace(/ /g, '-')}`;
}

@Pipe({
  name: 'fieldToImperiaTableColumnClass',
  standalone: true,
})
export class FieldToImperiaTableColumnClassPipe implements PipeTransform {
  transform(field: string, withPrefix: boolean = true): string {
    return fieldToImperiaTableColumnClass(field, withPrefix);
  }
}
