import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  Host,
  Inject,
  input,
  OnDestroy,
  Optional,
  resource,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { areEqual } from '@imperiascm/scp-utils/functions';
import {
  TUNSAVED_DATA,
  UNSAVED_DATA,
} from '../../../imp-data-sync/unsaved-data.token';
import { ImpTranslateModule, ImpTranslatePipe } from '@imperiascm/translate';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  interval,
  map,
  merge,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';

export abstract class ImpFormUnsavedChanges {
  unsavedChangesCheckers: ImpFormUnsavedChangesCheckerComponent[] = [];
}

@Component({
  selector: 'imp-form-unsaved-changes-checker',
  standalone: true,
  imports: [CommonModule, ImpTranslateModule],
  providers: [ImpTranslatePipe],
  templateUrl: './imp-form-unsaved-changes-checker.component.html',
  styleUrls: ['./imp-form-unsaved-changes-checker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpFormUnsavedChangesCheckerComponent implements OnDestroy {
  //#region INPUTS
  public $formFromInput = input<FormGroup | null>(null, {
    alias: 'form',
  });
  public formFromInput$ = toObservable(this.$formFromInput);
  //#endregion INPUTS

  private onUpdateSavedState = new Subject<void>();
  public updateSavedState = () => {
    this.onUpdateSavedState.next();
    this.$initialRawValue.reload();
    this.$rawValue.reload();
  };

  private form$ = merge(
    interval().pipe(map(() => this.formGroupDirective?.form)),
    this.formFromInput$
  ).pipe(
    distinctUntilChanged(),
    filter((form): form is FormGroup => !!form),
    take(1),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private initialRawValue$ = merge(
    this.form$,
    this.onUpdateSavedState.pipe(switchMap(() => this.form$.pipe(take(1))))
  ).pipe(
    map((form) => structuredClone(form.getRawValue())),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private rawValue$ = merge(
    this.form$,
    this.form$.pipe(
      switchMap((form) => form.valueChanges.pipe(map(() => form)))
    ),
    this.onUpdateSavedState.pipe(switchMap(() => this.form$.pipe(take(1))))
  ).pipe(
    map((form) => structuredClone(form.getRawValue())),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private readonly unsavedChangesIdentifier = new Date().getTime();

  public hasUnsavedChanges$ = combineLatest([
    this.initialRawValue$,
    this.rawValue$,
  ]).pipe(
    map(([initialRawValue, rawValue]) => !areEqual(initialRawValue, rawValue)),
    tap((unsaved) => this.setUnsavedData(unsaved)),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private $formValueChanges = toSignal(
    this.form$.pipe(
      switchMap((form) => form.valueChanges.pipe(map(() => form)))
    ),
    { equal: () => false }
  );

  private $form = toSignal(
    merge(
      interval().pipe(map(() => this.formGroupDirective?.form)),
      this.formFromInput$
    ).pipe(
      distinctUntilChanged(),
      filter((form): form is FormGroup => !!form),
      take(1)
    )
  );

  private $initialRawValue = resource({
    request: () => ({ form: this.$form() }),
    loader: ({ request: { form } }) => {
      if (!form) return {};
      return structuredClone(form.getRawValue());
    },
  });

  private $rawValue = resource({
    request: () => ({
      formValueChanges: this.$formValueChanges(),
      form: this.$form(),
    }),
    loader: ({ request: { formValueChanges, form } }) => {
      if (!!formValueChanges) {
        return structuredClone(formValueChanges.getRawValue());
      }
      if (form) {
        return structuredClone(form.getRawValue());
      }
      return {};
    },
  });

  public $hasUnsavedChanges = computed(() => {
    const initialRawValue = this.$initialRawValue.value();
    const rawValue = this.$rawValue.value();
    if (!initialRawValue || !rawValue) return false;
    const areNotEqual = !areEqual(initialRawValue, rawValue);
    return areNotEqual;
  });

  constructor(
    @Inject(UNSAVED_DATA)
    private UNSAVED_DATA$: TUNSAVED_DATA,
    @Optional() @Host() public formGroupDirective?: FormGroupDirective
  ) {
    effect(() => this.setUnsavedData(this.$hasUnsavedChanges()));
  }

  ngOnDestroy(): void {
    this.setUnsavedData(false);
  }

  private setUnsavedData(unsaved: boolean) {
    const unsavedData = this.UNSAVED_DATA$.value;
    const isAlreadyUnsaved = unsavedData.includes(
      this.unsavedChangesIdentifier
    );
    if (unsaved && isAlreadyUnsaved) return;
    if (!unsaved && !isAlreadyUnsaved) return;
    this.UNSAVED_DATA$.next(
      unsaved
        ? unsavedData.concat(this.unsavedChangesIdentifier)
        : unsavedData.filter((f) => f !== this.unsavedChangesIdentifier)
    );
  }
}
