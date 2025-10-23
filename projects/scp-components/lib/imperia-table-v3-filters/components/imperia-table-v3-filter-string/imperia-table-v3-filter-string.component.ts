import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ImperiaTableV3FilterDirective } from '../../directives/imperia-table-v3-filter.directive';

@Component({
  selector: 'imperia-table-v3-filter-string',
  templateUrl: './imperia-table-v3-filter-string.component.html',
  styleUrls: ['./imperia-table-v3-filter-string.component.scss'],
  providers: [
    {
      provide: ImperiaTableV3FilterDirective,
      useExisting: ImperiaTableV3FilterStringComponent,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV3FilterStringComponent<
  TItem extends object
> extends ImperiaTableV3FilterDirective<TItem> {
  @ViewChild('defaultTemplate') defaultTemplate!: TemplateRef<{
    $implicit: string;
  }>;
}
