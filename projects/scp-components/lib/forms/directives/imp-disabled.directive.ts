import { Directive, Input, OnDestroy } from '@angular/core';
import { AbstractControl, NgControl } from '@angular/forms';
import {
  ReplaySubject,
  combineLatest,
  filter,
  first,
  interval,
  map,
  tap,
} from 'rxjs';

@Directive({
  selector: '[impDisabled]',
  standalone: true,
})
export class ImpDisabledDirective implements OnDestroy {
  @Input() set impDisabled(condition: boolean | null) {
    this.disabled.next(!!condition);
  }
  private disabled = new ReplaySubject<boolean>(1);
  private control$ = interval().pipe(
    map(() => this.ngControl.control),
    filter((control): control is AbstractControl => !!control),
    first(),
  );
  private enableDisableOnCondition = combineLatest([
    this.disabled,
    this.control$,
  ])
    .pipe(
      tap(([condition, control]) =>
        condition
          ? control.disable({ emitEvent: false })
          : control.enable({ emitEvent: false }),
      ),
    )
    .subscribe();
  constructor(private ngControl: NgControl) {}

  ngOnDestroy(): void {
    this.enableDisableOnCondition.unsubscribe();
  }
}
