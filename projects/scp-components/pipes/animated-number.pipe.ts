import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectorRef,
  OnDestroy,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { LOCALE, LOCALES } from '@imperiascm/scp-utils/functions';
import {
  Observable,
  Subject,
  Subscription,
  animationFrameScheduler,
  distinctUntilChanged,
  endWith,
  expand,
  map,
  pairwise,
  scheduled,
  startWith,
  switchMap,
  takeWhile,
  tap,
} from 'rxjs';

export function animateRange(
  start: number,
  end: number,
  duration: number
): Observable<number> {
  const startTime = performance.now();
  const rangeSize = Math.abs(end - start);
  const step = start < end ? 1 : -1;

  return scheduled([0], animationFrameScheduler).pipe(
    expand(() => scheduled([0], animationFrameScheduler)),
    map(() => {
      const elapsed = performance.now() - startTime;

      const linearProgress = Math.min(elapsed / duration, 1);
      const quadraticProgress = linearProgress * linearProgress;

      return start + step * quadraticProgress * rangeSize;
    }),
    takeWhile(
      (value) =>
        parseFloat(Math.max(value, end).toFixed(2)) !==
        parseFloat(Math.min(value, end).toFixed(2)),
      true
    ),
    endWith(end)
  );
}

@Pipe({
  name: 'animatedNumber',
  standalone: true,
  pure: false,
})
export class AnimatedNumberPipe implements PipeTransform, OnDestroy {
  private _decimalPipe = new DecimalPipe(LOCALE());

  private animate = new Subject<number>();
  private animation$ = this.animate.pipe(
    startWith(null),
    distinctUntilChanged(),
    pairwise(),
    switchMap(([start, end]) =>
      animateRange(start ?? end ?? 0, end ?? 0, this._duration)
    )
  );

  private _animated: string | null = null;
  private _digitsInfo = '1.0-0';
  private _locale = LOCALE();
  private _duration = 500;

  private _ref: ChangeDetectorRef;
  private animation: Subscription;

  constructor(ref: ChangeDetectorRef) {
    this._ref = ref;
    this.animation = this.animation$
      .pipe(tap(() => this._ref.markForCheck()))
      .subscribe(
        (animated) =>
          (this._animated = this._decimalPipe.transform(
            animated,
            this._digitsInfo,
            this._locale
          ))
      );
  }

  transform(
    value: number | string | null | undefined,
    digitsInfo?: string,
    locale?: LOCALES,
    duration?: number
  ): string | null {
    this._digitsInfo = digitsInfo || this._digitsInfo;
    this._locale = locale || this._locale;
    this._duration = duration || this._duration;
    this.animate.next(Number(value));
    return this._animated;
  }

  ngOnDestroy(): void {
    this.animation.unsubscribe();
    this._ref = null as any;
  }
}
