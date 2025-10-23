import { contentChild, Directive, input, TemplateRef } from '@angular/core';

@Directive({
  selector: 'imperia-table-v3-columns-configurator-tag',
  standalone: true,
})
export class ImperiaTableV3ColumnsConfiguratorTagDirective {
  public $tagName = input.required<string>({ alias: 'tagName' });
  public $taggedColumns = input.required<string[]>({ alias: 'taggedColumns' });
  public $template = contentChild(TemplateRef);

  constructor() {}
}
