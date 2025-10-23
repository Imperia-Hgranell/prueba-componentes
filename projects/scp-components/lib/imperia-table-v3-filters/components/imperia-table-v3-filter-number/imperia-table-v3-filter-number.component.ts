import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ImperiaTableV3FilterDirective } from '../../directives/imperia-table-v3-filter.directive';

@Component({
  selector: 'imperia-table-v3-filter-number',
  templateUrl: './imperia-table-v3-filter-number.component.html',
  styleUrls: ['./imperia-table-v3-filter-number.component.scss'],
  providers: [
    {
      provide: ImperiaTableV3FilterDirective,
      useExisting: ImperiaTableV3FilterNumberComponent,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV3FilterNumberComponent<
  TItem extends object
> extends ImperiaTableV3FilterDirective<TItem> {
  @ViewChild('defaultTemplate') defaultTemplate!: TemplateRef<{
    $implicit: number;
  }>;
}
