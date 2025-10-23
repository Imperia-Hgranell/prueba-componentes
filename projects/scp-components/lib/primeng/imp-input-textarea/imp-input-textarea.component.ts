import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { InputTextareaModule } from 'primeng/inputtextarea';
import {
  BehaviorSubject,
  combineLatestWith,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { ImperiaIconButtonComponent } from '../../imperia-icon-button/imperia-icon-button.component';

export type ImpInputTextAreaResize =
  | 'none'
  | 'both'
  | 'horizontal'
  | 'vertical';

@Component({
  selector: 'imp-input-textarea',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextareaModule,
    ImperiaIconButtonComponent,
  ],
  templateUrl: './imp-input-textarea.component.html',
  styleUrls: ['./imp-input-textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ImpInputTextareaComponent,
      multi: true,
    },
  ],
})
export class ImpInputTextareaComponent implements ControlValueAccessor {
  //#region INPUTS
  @Input() autoResize: boolean = false;
  @Input() resize: ImpInputTextAreaResize = 'vertical';
  @Input('height') collapsedHeight: number = 30;
  @Input() expandedHeight: number = 90;
  @Input() showExpandButton: boolean = false;
  //#endregion INPUTS

  //#region PUBLIC VARIABLES
  public value: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public expanded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public height: number = this.collapsedHeight;
  //#endregion PUBLIC VARIABLES

  //#region PRIVATE VARIABLES
  private disabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private expanded$ = this.expanded.pipe(
    tap((expanded) => {
      if (expanded) {
        this.height = this.expandedHeight;
      } else {
        this.height = this.collapsedHeight;
      }
    })
  );
  private writingValue: boolean = true;
  private value$ = this.value.pipe(
    switchMap((value) =>
      this.writingValue
        ? of(value).pipe(tap(() => (this.writingValue = false)))
        : of(value).pipe(
            tap((_) => this.onTouch()),
            tap((value) => this.onChange(value))
          )
    )
  );
  private onChange = (value: string) => {};
  private onTouch = () => {};
  //#endregion PRIVATE VARIABLES

  //#region VIEWMODEL
  vm$ = of({}).pipe(
    combineLatestWith(this.disabled, this.value$, this.expanded$),
    map(([_, disabled, value, expanded]) => ({
      disabled,
      value,
      expanded,
    }))
  );
  //#endregion VIEWMODEL

  constructor() {}

  writeValue(value: string): void {
    this.value.next(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.next(isDisabled);
  }
}
