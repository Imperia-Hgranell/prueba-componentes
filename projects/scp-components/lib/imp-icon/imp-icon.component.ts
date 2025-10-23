import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ImpTooltipDirective } from '../directives/imp-tooltip.directive';
@Component({
  selector: 'imp-icon',
  imports: [ImpTooltipDirective],
  templateUrl: './imp-icon.component.html',
  styleUrl: './imp-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpIconComponent {
  //#region INPUTS
  public $icon = input<string>('', { alias: 'icon' });
  public $tooltip = input<string>('', { alias: 'tooltip' });
  //#endregion INPUTS
}
