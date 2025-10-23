import { CdkMenuItem } from '@angular/cdk/menu';
import { Directive, input } from '@angular/core';

@Directive({
  selector: '[CdkMenuItemKeepOpen]',
  standalone: true,
})
export class CdkMenuItemKeepOpenDirective {
  public $enabled = input<boolean, boolean | null | undefined>(true, {
    alias: 'CdkMenuItemKeepOpen',
    transform: Boolean,
  });

  constructor(private cdkMenuItem: CdkMenuItem) {
    this.overrideTriggerMethod();
  }

  private overrideTriggerMethod(): void {
    const originalTrigger = this.cdkMenuItem.trigger.bind(this.cdkMenuItem);

    this.cdkMenuItem.trigger = (args?: any) => {
      const modifiedArgs = { ...args, keepOpen: this.$enabled() };
      originalTrigger(modifiedArgs);
    };
  }
}
