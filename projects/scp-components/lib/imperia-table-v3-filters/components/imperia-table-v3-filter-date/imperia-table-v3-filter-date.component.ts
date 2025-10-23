import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ImperiaTableV3FilterDirective } from '../../directives/imperia-table-v3-filter.directive';

@Component({
  selector: 'imperia-table-v3-filter-date',
  templateUrl: './imperia-table-v3-filter-date.component.html',
  styleUrls: ['./imperia-table-v3-filter-date.component.scss'],
  providers: [
    {
      provide: ImperiaTableV3FilterDirective,
      useExisting: ImperiaTableV3FilterDateComponent,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV3FilterDateComponent<
  TItem extends object
> extends ImperiaTableV3FilterDirective<TItem> {}
