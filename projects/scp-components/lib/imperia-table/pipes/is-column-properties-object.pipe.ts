import { Pipe, PipeTransform } from '@angular/core';
import { TImperiaTableColumnProperties } from '../models/imperia-table-columns.types';

@Pipe({
  name: 'isColumnPropertiesObject',
  standalone: true,
})
export class IsColumnPropertiesObjectPipe implements PipeTransform {
  transform(object: any): object is TImperiaTableColumnProperties<any> {
    if (!object) return false;
    if (
      !('field' in object) ||
      !('header' in object) ||
      !('dataInfo' in object) ||
      !('width' in object)
    ) {
      return false;
    }
    return true;
  }
}
