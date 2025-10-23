import { Directive, Input, TemplateRef } from '@angular/core';
import { ImperiaTableRow } from '../models/imperia-table-rows.models';

@Directive({
  selector: '[imperiaTableV2RowDetail]',
    standalone: false
})
export class ImperiaTableV2RowDetailDirective<TItem extends object> {
  @Input('enabled') set enabledSetter(
    v: boolean | ((row: ImperiaTableRow<TItem>) => boolean) | null,
  ) {
    if (v === null) {
      this.enabled = () => true;
    } else if (typeof v === 'boolean') {
      this.enabled = () => v;
    } else {
      this.enabled = v;
    }
  }

  public enabled: (row: ImperiaTableRow<TItem>) => boolean = () => true;

  private detailedRows: ImperiaTableRow<TItem>[] = [];

  constructor(public template: TemplateRef<any>) {}

  public isDetailed(row: ImperiaTableRow<TItem>): boolean {
    return this.detailedRows.includes(row);
  }

  public show(row: ImperiaTableRow<TItem>): void {
    if (this.isDetailed(row)) {
      return;
    }
    if (!this.enabled(row)) {
      return;
    }
    this.detailedRows.push(row);
  }

  public hide(row: ImperiaTableRow<TItem>): void {
    if (!this.isDetailed(row)) {
      return;
    }
    this.detailedRows = this.detailedRows.filter((r) => r !== row);
  }
}
