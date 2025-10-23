import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { ImpClickEventsDirective } from '@imperiascm/dom-utils';
import { toggle } from '@imperiascm/rxjs-utils';
import {
  debounce,
  distinctUntilChanged,
  filter,
  map,
  ReplaySubject,
  share,
  shareReplay,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';

@Component({
  selector: 'imperia-table-v3-search',
  templateUrl: './imperia-table-v3-search.component.html',
  styleUrls: ['./imperia-table-v3-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV3SearchComponent {
  @ViewChild('input') public input!: ElementRef<HTMLInputElement>;

  //#region DEBOUNCE TIME
  @Input('debounceTime') debounceTime: number = 300;
  //#endregion DEBOUNCE TIME

  //#region VALUE
  @Input('value') public set valueSetter(v: string | null) {
    this._value.next(v ?? '');
  }
  private _value = new ReplaySubject<string>(1);
  private _valueChange = this._value.pipe(distinctUntilChanged());
  public value$ = this._valueChange.pipe(
    debounce(() => timer(this.debounceTime)),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  @Output('valueChange') public valueChange$ = this.value$.pipe(share());
  //#endregion VALUE

  //#region EXPANDED
  private readonly clickEvents = new ImpClickEventsDirective(this.el);
  public readonly expanded = toggle({
    startWith: this._value.pipe(map(Boolean)),
    trueWith: this.clickEvents.onClickIn$.pipe(
      tap(() => this.input.nativeElement.focus())
    ),
    falseWith: this.clickEvents.onClickOut$.pipe(
      switchMap(() => this._value.pipe(take(1))),
      filter((v) => !v)
    ),
  });
  //#endregion EXPANDED

  constructor(private el: ElementRef<HTMLElement>) {}

  public set(value: string): void {
    this._value.next(value);
  }
}
