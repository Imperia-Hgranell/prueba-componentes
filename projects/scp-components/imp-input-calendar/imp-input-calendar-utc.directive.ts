import { Directive, Host, Input, OnInit, Self } from '@angular/core';
import { Calendar } from 'primeng/calendar';

@Directive({
  selector: '[useUtc]',
  standalone: true,
})
export class UseUtcDirective implements OnInit {
  private enableUTC: boolean = true;
  @Input('useUtc') set useUtc(value: boolean | string | undefined) {
    // Convertir el valor a booleano si es una cadena
    this.enableUTC = value === '' || value === true;
  }
  constructor(@Host() @Self() private calendar: Calendar) {}

  ngOnInit(): void {
    if (!this.enableUTC) return;

    const oUpdateModel: (value: any) => void = this.calendar.updateModel;

    this.calendar.updateModel = function (this: any, value: any) {
      if (this.calendar.isMultipleSelection()) {
        console.warn(
          'useUtc directive is not implemented for multiple selection',
        );
        oUpdateModel.call(this.calendar, value);
        return;
      }

      if (!value) {
        oUpdateModel.call(this.calendar, value);
        return;
      }
      if (this.calendar.dataType != 'date') {
        oUpdateModel.call(this.calendar, value);
        return;
      }
      if (this.calendar.timeOnly) {
        oUpdateModel.call(this.calendar, value);
        return;
      }

      const asUtc = (date: Date) =>
        new Date(
          Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0,
          ),
        );

      if (this.calendar.isRangeSelection()) {
        for (let i = 0; i < value.length; i++) {
          value[i] && (value[i] = asUtc(value[i]));
        }
      } else {
        value = asUtc(value);
      }

      oUpdateModel.call(this.calendar, value);
    }.bind(this);
  }
}
