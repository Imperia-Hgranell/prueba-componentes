import { Directive, Input, TemplateRef } from '@angular/core';
import { ImpMenuV2ItemGroupDirective } from './imp-menu-v2-item-group.directive';
import { ImpMenuV2SeparatorPositions } from '../models/imp-menu-v2.models';

interface ImpMenuV2ItemTemplateContext {
  $implicit: boolean;
}

@Directive({
  selector: '[impMenuV2Item]',
  standalone: false,
})
export class ImpMenuV2ItemDirective {
  @Input('impMenuV2Item') set separatorsSetter(
    v: ImpMenuV2SeparatorPositions | ''
  ) {
    this._separators = v;
  }
  private _separators: ImpMenuV2SeparatorPositions | '' = '';
  @Input('impMenuV2ItemNeverCollapse') public neverCollapse: boolean = false;
  @Input('impMenuV2ItemCollapseOrder') public collapseOrder: number = -1;
  @Input('impMenuV2ItemName') name: string = '';

  public get separators(): ImpMenuV2SeparatorPositions | '' {
    return (
      this._separators || (this.group.position === 'left' ? 'after' : 'before')
    );
  }
  public collapsed: boolean = false;
  public containerWidth: number = 0;

  constructor(
    public group: ImpMenuV2ItemGroupDirective,
    public template: TemplateRef<ImpMenuV2ItemTemplateContext>
  ) {}
}
