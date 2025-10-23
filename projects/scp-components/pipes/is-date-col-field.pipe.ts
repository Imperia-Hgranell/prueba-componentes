import { Pipe, PipeTransform } from '@angular/core';
import { isDateAmountColField } from '@imperiascm/scp-utils/models';

@Pipe({
  name: 'isDateColField',
  standalone: true,
})
export class IsDateColFieldPipe implements PipeTransform {
  transform(value: string | null | undefined): boolean {
    if (!value) return false;
    return isDateAmountColField(value);
  }
}
