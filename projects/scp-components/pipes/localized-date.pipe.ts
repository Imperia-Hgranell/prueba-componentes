import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { ImpTranslateService } from '@imperiascm/translate';

@Pipe({
  name: 'localizedDate',
  standalone: true,
})
export class LocalizedDatePipe implements PipeTransform {
  private readonly datePipe = new DatePipe(this.translateService.currentLang);
  constructor(private translateService: ImpTranslateService) {}

  transform(
    value: Date | string | null,
    pattern: string = 'dd/MM/yyyy'
  ): string {
    return this.datePipe.transform(value, pattern) || '';
  }
}
