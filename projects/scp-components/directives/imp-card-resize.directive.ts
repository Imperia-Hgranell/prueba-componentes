import {
  ComponentRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  OutputRefSubscription,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { ImpArrowControls } from '@imperiascm/scp-components/imp-arrow-controls';

@Directive({
  selector: '[impCardResize]',
})
export class ImpCardResizeDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private componentRef?: ComponentRef<ImpArrowControls>;

  public $inputColumns = input.required<number>({
    alias: 'columns',
  });
  public $minColumns = input<number>(0, {
    alias: 'minColumns',
  });
  public $maxColumns = input<number>(0, {
    alias: 'maxColumns',
  });

  public $NColumns = input<number>(12, {
    alias: 'nColumns',
  });

  public $externalMargin = input<string>('0px', {
    alias: 'externalMargin',
  });

  public $showResizer = input.required<boolean | undefined>({
    alias: 'showResizer',
  });

  public $allowVisibility = input<boolean>(false, {
    alias: 'allowVisibility',
  });

  private ColumnsChanges?: OutputRefSubscription;

  private inputColumnsEffect = effect(() => {
    if (this.$inputColumns()) this.$columnsValue.set(this.$inputColumns());
  });

  public $columnsValue = signal<number | undefined>(0);
  public $outputValue = output<number>({
    alias: 'onColumnsChanges',
  });

  private applyColumnsEffect = effect(() => {
    if (this.elementRef)
      this.elementRef.nativeElement.style.width = `calc(${
        (100 * this.$columnsValue()!) / this.$NColumns()!
      }% - ${this.$externalMargin()})`;

    this.$outputValue.emit(this.$columnsValue() || 0);
  });

  private showResizer = effect(() => {
    if (this.$showResizer()) {
      if (!this.componentRef) {
        this.componentRef = this.viewContainerRef.createComponent(
          ImpArrowControls,
          {
            injector: this.injector,
          }
        );
        this.componentRef.setInput('value', this.$inputColumns());
        if (this.$minColumns())
          this.componentRef.setInput('minValue', this.$minColumns());
        if (this.$maxColumns())
          this.componentRef.setInput('maxValue', this.$maxColumns());
        if (this.$allowVisibility())
          this.componentRef.setInput(
            'allowVisibility',
            this.$allowVisibility()
          );

        (
          this.componentRef.location.nativeElement as HTMLElement
        ).style.position = 'absolute';
        (this.componentRef.location.nativeElement as HTMLElement).style.top =
          '-15px';

        this.elementRef.nativeElement.style.position = 'relative';

        this.elementRef.nativeElement.appendChild(
          this.componentRef.location.nativeElement
        );

        this.ColumnsChanges =
          this.componentRef.instance.$onValueChanges.subscribe((value) =>
            this.$columnsValue.set(value)
          );
      }
    } else {
      this.destroyComponent();
    }
  });

  private destroyComponent() {
    this.ColumnsChanges?.unsubscribe();
    this.ColumnsChanges = undefined;
    this.componentRef?.destroy();
    this.componentRef = undefined;
    this.viewContainerRef.clear();
  }
}
