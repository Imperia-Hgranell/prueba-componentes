import { Directive } from '@angular/core';

export type ImperiaTableV2RowSelectionContextMenuButtonTemplate = {
  $implicit: {
    copying: {
      state: boolean;
      from: 'row' | 'selection';
      totalRowsToCopy: number;
      result: boolean | null;
    };
    selection: any[];
    currentRowCountBeingCopied: number;
  };
  config: {
    text: string;
    items: any[];
    from: 'row' | 'selection';
  };
};

@Directive({
  selector: '[imperiaTableV2RowSelectionContextMenuButtonTemplate]',
    standalone: false
})
export class ImperiaTableV2RowSelectionContextMenuButtonTemplateDirective {
  static ngTemplateContextGuard(
    directive: ImperiaTableV2RowSelectionContextMenuButtonTemplateDirective,
    context: unknown,
  ): context is ImperiaTableV2RowSelectionContextMenuButtonTemplate {
    return true;
  }
}
