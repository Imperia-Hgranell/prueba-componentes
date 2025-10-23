import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'imp-arrow-controls',
  imports: [NgClass],
  templateUrl: './imp-arrow-controls.component.html',
  styleUrl: './imp-arrow-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpArrowControls {
  public $inputValue = input<number>(0, {
    alias: 'value',
  });
  public $minValue = input<number>(0, {
    alias: 'minValue',
  });
  public $maxValue = input<number>(Number.MAX_VALUE, {
    alias: 'maxValue',
  });

  private inputEffect = effect(() => {
    if (this.$inputValue()) this.$value.set(this.$inputValue());
  });

  public $value = signal(0);
  public $onValueChanges = output<number>({ alias: 'onValueChanges' });

  public updateValue = (amount: number) => {
    if (
      (amount < 0 && this.$value() === this.$minValue()) ||
      (amount > 0 && this.$value() === this.$maxValue())
    )
      return;
    this.$value.update((value) => value + amount);

    this.$onValueChanges.emit(this.$value());
  };

  public $allowVisibilityToggle = input<boolean>(false, {
    alias: 'allowVisibility',
  });

  public $visible = signal(true);
}
