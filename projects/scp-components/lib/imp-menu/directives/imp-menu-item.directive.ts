import { Directive, Input, TemplateRef } from '@angular/core';
import { ImpMenuSeparatorPositions } from '../models/imp-menu.models';

@Directive({
  selector: '[impMenuItem]',
    standalone: false
})
export class ImpMenuItemDirective {
  @Input('impMenuItem')
  separators: ImpMenuSeparatorPositions | '' = 'none';
  constructor(public template: TemplateRef<any>) {}
}
