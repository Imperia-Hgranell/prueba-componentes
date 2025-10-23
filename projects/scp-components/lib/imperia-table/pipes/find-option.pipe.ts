import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'findOption',
  standalone: true,
})
export class FindOptionPipe implements PipeTransform {
  transform(
    options: any[],
    value: any,
    valueProperty: string,
    labelProperty: string,
  ): unknown {
    return (
      options.find((option) => option[valueProperty] === value)?.[
        labelProperty
      ] ?? value
    );
  }
}
