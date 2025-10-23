import { computed, Directive, input, Signal } from '@angular/core';
import { ColumnConfiguration } from '../imperia-table/models/imperia-table-v2-columns-configurator.models';

@Directive({
  selector: 'imperia-table-column-default-configuration',
  standalone: true,
})
export class ImperiaTableColumnDefaultConfigurationDirective {
  public $column = input.required<string>({ alias: 'column' });
  public $frozen = input<boolean>(false, {
    alias: 'frozen',
  });
  public $frozenPosition = input<'left' | 'right'>('left', {
    alias: 'frozenPosition',
  });
  public $visible = input<boolean>(true, {
    alias: 'visible',
  });

  public $configuration: Signal<ColumnConfiguration> = computed(() => ({
    field: this.$column(),
    frozen: this.$frozen(),
    frozenPosition: this.$frozenPosition(),
    visible: this.$visible(),
  }));

  constructor() {}
}
