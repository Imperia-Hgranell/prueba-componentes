import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Directive,
  inject,
  input,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { httpRequest } from '@imperiascm/rxjs-utils';
import { ICONS_NAMES } from '../../../imperia-icon-button/imperia-icon-button.component';
import { ImperiaTableV2CellOverlayComponent } from '../imperia-table-v2-cell-overlay/imperia-table-v2-cell-overlay.component';
import { ImperiaTableV2ClickEvent } from '../../directives/imperia-table-v2-clicks.directive';
import { asObservable } from '@imperiascm/scp-utils';
import { ImpTranslateService } from '@imperiascm/translate';
import {
  combineLatest,
  defer,
  filter,
  first,
  from,
  map,
  merge,
  Observable,
  of,
  ReplaySubject,
  share,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
} from 'rxjs';

export interface ImperiaTableV2CellValueRestorerFnParams<
  TCurrentValue,
  TValueToRestore,
  TItem extends object,
  ClickEventCanBeNull extends boolean = false
> {
  current: TCurrentValue;
  toRestore: TValueToRestore;
  clickEvent: ClickEventCanBeNull extends true
    ? ImperiaTableV2ClickEvent<TItem> | null
    : ImperiaTableV2ClickEvent<TItem>;
  cancel: () => void;
}

export interface ImperiaTableV2CellValueRestorerValidationFnParams<
  TCurrentValue,
  TValueToRestore,
  TItem extends object,
  TRestored,
  ClickEventCanBeNull extends boolean = false
> {
  current: TCurrentValue;
  toRestore: TValueToRestore;
  clickEvent: ClickEventCanBeNull extends true
    ? ImperiaTableV2ClickEvent<TItem> | null
    : ImperiaTableV2ClickEvent<TItem>;
  restored: TRestored;
}

export interface ImperiaTableV2CellValueRestorerEvent<
  TCurrentValue,
  TValueToRestore,
  TItem extends object,
  TRestored = any,
  ClickEventCanBeNull extends boolean = false
> {
  current: TCurrentValue;
  toRestore: TValueToRestore;
  clickEvent: ClickEventCanBeNull extends true
    ? ImperiaTableV2ClickEvent<TItem> | null
    : ImperiaTableV2ClickEvent<TItem>;
  restored: TRestored;
}

export type ImperiaTableV2CellValueRestorerTemplateContext<
  TItem extends object,
  ClickEventCanBeNull extends boolean = false,
  TCurrentValue = any,
  TValueToRestore = any
> = {
  $implicit: {
    current: TCurrentValue;
    toRestore: TValueToRestore;
    areEqual: boolean;
    canRestore: boolean;
    event: ClickEventCanBeNull extends true
      ? ImperiaTableV2ClickEvent<TItem> | null
      : ImperiaTableV2ClickEvent<TItem>;
  };
};

@Directive({
  selector: '[imperia-table-v2-cell-value-restorer-template]',
  standalone: false,
})
export class ImperiaTableV2CellValueRestorerTemplateDirective<
  TItem extends object
> {
  @Input('imperia-table-v2-cell-value-restorer-template') type: string = '';

  constructor(
    public template: TemplateRef<
      ImperiaTableV2CellValueRestorerTemplateContext<TItem>
    >
  ) {}

  static ngTemplateContextGuard<TItem extends object>(
    dir: ImperiaTableV2CellValueRestorerTemplateDirective<TItem>,
    ctx: unknown
  ): ctx is ImperiaTableV2CellValueRestorerTemplateContext<TItem> {
    return true;
  }
}

@Component({
  selector: 'imperia-table-v2-cell-value-restorer',
  templateUrl: './imperia-table-v2-cell-value-restorer.component.html',
  styleUrls: ['./imperia-table-v2-cell-value-restorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImperiaTableV2CellValueRestorerComponent<
  TItem extends object,
  ClickEventCanBeNull extends boolean = false,
  TCurrentValue = any,
  TValueToRestore = any,
  TRestored = any
> implements OnInit, OnDestroy
{
  eventCanBeNull = input<ClickEventCanBeNull>(false as ClickEventCanBeNull);

  protected cellOverlay = inject(ImperiaTableV2CellOverlayComponent<TItem>, {
    optional: true,
  });

  public clickEvent$ = defer(() => {
    if (!this.cellOverlay) return of(null);
    return this.cellOverlay.onOpen$;
  });
  protected typedTranslateService = inject(ImpTranslateService);

  public readonly TRANSLATION =
    this.typedTranslateService.translation.IMPERIA_TABLE_V2_CELL_VALUE_RESTORER;

  @Input('title') title: string = this.TRANSLATION.title;
  @Input('withHeader') withHeader: boolean = true;
  @Input('restoreIcon') restoreIcon: ICONS_NAMES = 'x';

  ngOnInit(): void {
    this.cellOverlay?.cellValueRestorerComponents.next([
      ...this.cellOverlay.cellValueRestorerComponents.value,
      this,
    ]);
  }

  ngOnDestroy(): void {
    this.cellOverlay?.cellValueRestorerComponents.next(
      this.cellOverlay.cellValueRestorerComponents.value.filter(
        (component) => component !== this
      )
    );
  }

  //#region DISABLED
  @Input('disabled') set disabledSetter(v: boolean | null) {
    if (!v) return;
    this.disabled.next(v);
  }
  public disabled = new ReplaySubject<boolean>(1);
  //#endregion DISABLED

  //#region INPUT FUNCTIONS
  @Input('getCurrentValueFn') getCurrentValueFn: (
    event: ImperiaTableV2ClickEvent<TItem>
  ) => TCurrentValue | Observable<TCurrentValue> | Promise<TCurrentValue> =
    () => null as any;

  @Input('getValueToRestoreFn') getValueToRestoreFn: (
    event: ImperiaTableV2ClickEvent<TItem>
  ) =>
    | TValueToRestore
    | Observable<TValueToRestore>
    | Promise<TValueToRestore> = () => null as any;

  @Input('areEqualFn') areEqualFn: (
    current: TCurrentValue,
    toRestore: TValueToRestore
  ) => boolean | Observable<boolean> | Promise<boolean> = (
    current,
    toRestore
  ) => (current as any) === (toRestore as any);

  @Input('canRestoreFn') canRestoreFn: (
    current: TCurrentValue,
    toRestore: TValueToRestore
  ) => boolean | Observable<boolean> | Promise<boolean> = (
    current,
    toRestore
  ) => (current as any) !== (toRestore as any);

  @Input('restoreFn') restoreFn: (
    params: ImperiaTableV2CellValueRestorerFnParams<
      TCurrentValue,
      TValueToRestore,
      TItem
    >
  ) => Observable<TRestored> | Promise<TRestored> = () => of(false) as any;

  @Input('restoreValidationFn') restoreValidationFn: (
    params: ImperiaTableV2CellValueRestorerValidationFnParams<
      TCurrentValue,
      TValueToRestore,
      TItem,
      TRestored
    >
  ) => boolean = ({ restored }) => !!restored;

  @Input('restoreSuccessFn') restoreSuccessFn: (
    event: ImperiaTableV2CellValueRestorerEvent<
      TCurrentValue,
      TValueToRestore,
      TItem,
      TRestored,
      ClickEventCanBeNull
    >
  ) => Observable<any> | Promise<any> | any = () => of(null);

  @Input('restoreErrorFn') restoreErrorFn: (
    event: ImperiaTableV2CellValueRestorerEvent<
      TCurrentValue,
      TValueToRestore,
      TItem,
      TRestored,
      ClickEventCanBeNull
    >
  ) => Observable<any> | Promise<any> | any = () => of(null);

  @Input('restoreCancelFn') restoreCancelFn: (
    event: ImperiaTableV2CellValueRestorerEvent<
      TCurrentValue,
      TValueToRestore,
      TItem
    >
  ) => Observable<any> | Promise<any> | any = () => of(null);
  //#endregion INPUT FUNCTIONS

  //#region TEMPLATES
  @ContentChildren(ImperiaTableV2CellValueRestorerTemplateDirective)
  set templatesSetter(
    v: QueryList<ImperiaTableV2CellValueRestorerTemplateDirective<TItem>>
  ) {
    this.templateDirectives.next(v);
  }
  private templateDirectives = new ReplaySubject<
    QueryList<ImperiaTableV2CellValueRestorerTemplateDirective<TItem>>
  >(1);
  private templatesDirectives$: Observable<
    ImperiaTableV2CellValueRestorerTemplateDirective<TItem>[]
  > = this.templateDirectives.pipe(
    first(),
    switchMap((templates) =>
      templates.changes.pipe(startWith(templates.toArray()))
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion TEMPLATES

  //#region CURRENT VALUE HEADER TEMPLATE
  @ViewChild('defaultCurrentValueHeaderTemplate', { static: true })
  public defaultCurrentValueHeaderTemplate!: TemplateRef<
    ImperiaTableV2CellValueRestorerTemplateContext<TItem>
  >;
  public currentValueHeaderTemplate$ = this.templatesDirectives$.pipe(
    map((templatesDirectives) =>
      templatesDirectives.find(({ type }) => type === 'currentValueHeader')
    ),
    map((templatesDirective) => templatesDirective?.template)
  );
  //#endregion CURRENT VALUE HEADER TEMPLATE

  //#region CURRENT VALUE TEMPLATE
  @ViewChild('defaultCurrentValueTemplate', { static: true })
  public defaultCurrentValueTemplate!: TemplateRef<
    ImperiaTableV2CellValueRestorerTemplateContext<TItem>
  >;
  public currentValueTemplate$ = this.templatesDirectives$.pipe(
    map((templatesDirectives) =>
      templatesDirectives.find(({ type }) => type === 'currentValue')
    ),
    map((templatesDirective) => templatesDirective?.template)
  );
  //#endregion CURRENT VALUE TEMPLATE

  //#region TO RESTORE HEADER TEMPLATE
  @ViewChild('defaultToRestoreHeaderTemplate', { static: true })
  public defaultToRestoreHeaderTemplate!: TemplateRef<
    ImperiaTableV2CellValueRestorerTemplateContext<TItem>
  >;
  public toRestoreHeaderTemplate$ = this.templatesDirectives$.pipe(
    map((templatesDirectives) =>
      templatesDirectives.find(({ type }) => type === 'toRestoreHeader')
    ),
    map((templatesDirective) => templatesDirective?.template)
  );
  //#endregion TO RESTORE HEADER TEMPLATE

  //#region TO RESTORE TEMPLATE
  @ViewChild('defaultToRestoreTemplate', { static: true })
  public defaultToRestoreTemplate!: TemplateRef<
    ImperiaTableV2CellValueRestorerTemplateContext<TItem>
  >;
  public toRestoreTemplate$ = this.templatesDirectives$.pipe(
    map((templatesDirectives) =>
      templatesDirectives.find(({ type }) => type === 'toRestore')
    ),
    map((templatesDirective) => templatesDirective?.template)
  );
  //#endregion TO RESTORE TEMPLATE

  //#region RESTORE
  public restore = new Subject<{
    values: {
      current: TCurrentValue;
      toRestore: TValueToRestore;
    };
    clickEvent: ClickEventCanBeNull extends true
      ? ImperiaTableV2ClickEvent<TItem> | null
      : ImperiaTableV2ClickEvent<TItem>;
  }>();
  public readonly restoreRequest = httpRequest({
    on: this.restore,
    request: ({
      on: {
        values: { current, toRestore },
        clickEvent,
      },
      cancel,
    }) =>
      from(
        this.restoreFn({
          current,
          toRestore,
          clickEvent: clickEvent!,
          cancel,
        })
      ).pipe(
        map((restored) => ({
          restored,
          current,
          toRestore,
          clickEvent: clickEvent!,
        }))
      ),
    validateRequest: (data) => this.restoreValidationFn(data),
  });
  //#endregion RESTORE

  //#region RESTORE EVENTS
  @Output('onRestore') onRestore$: Observable<
    Omit<
      ImperiaTableV2CellValueRestorerEvent<
        TCurrentValue,
        TValueToRestore,
        TItem
      >,
      'restored'
    >
  > = this.restore.pipe(
    map(({ values, clickEvent }) => ({ ...values, clickEvent: clickEvent! }))
  );
  @Output('onRestoreSuccess') onRestoreSuccess$: Observable<
    ImperiaTableV2CellValueRestorerEvent<
      TCurrentValue,
      TValueToRestore,
      TItem,
      TRestored,
      ClickEventCanBeNull
    >
  > = this.restoreRequest.success$.pipe(
    switchMap((event) =>
      asObservable(this.restoreSuccessFn(event)).pipe(map(() => event))
    ),
    share()
  );
  @Output('onRestoreError') onRestoreError$: Observable<
    ImperiaTableV2CellValueRestorerEvent<
      TCurrentValue,
      TValueToRestore,
      TItem,
      TRestored,
      ClickEventCanBeNull
    >
  > = this.restoreRequest.error$.pipe(
    switchMap((event) =>
      asObservable(this.restoreErrorFn(event)).pipe(map(() => event))
    ),
    share()
  );
  @Output('onRestoreCancel') onRestoreCancel$: Observable<
    ImperiaTableV2CellValueRestorerEvent<TCurrentValue, TValueToRestore, TItem>
  > = this.restoreRequest.cancel$.pipe(
    map(({ values: { current, toRestore }, clickEvent }) => ({
      current,
      toRestore,
      clickEvent,
      restored: null,
    })),
    switchMap((event) =>
      asObservable(this.restoreCancelFn(event)).pipe(map(() => event))
    ),
    share()
  );
  //#endregion RESTORE EVENTS

  private initializer$ = defer(() => {
    if (!this.cellOverlay) return of(null);
    return this.cellOverlay.onOpen$.pipe(
      take(1),
      switchMap((event) =>
        merge(
          this.restoreRequest.success$,
          this.cellOverlay!.onCellValueRestored$,
          this.cellOverlay!.onCellForecastConceptDeleted$
        ).pipe(
          filter(({ clickEvent }) => clickEvent === event),
          map(() => event),
          startWith(event)
        )
      )
    );
  });

  //#region VALUES
  public values$: Observable<{
    current: TCurrentValue;
    toRestore: TValueToRestore;
    areEqual: boolean;
    canRestore: boolean;
  }> = this.initializer$.pipe(
    switchMap((event) =>
      combineLatest({
        current: asObservable(this.getCurrentValueFn(event!)),
        toRestore: asObservable(this.getValueToRestoreFn(event!)),
      }).pipe(map(({ current, toRestore }) => ({ current, toRestore, event })))
    ),
    switchMap(({ current, toRestore, event }) =>
      combineLatest({
        areEqual: asObservable(this.areEqualFn(current, toRestore)),
        canRestore: of(
          asObservable(this.canRestoreFn(current, toRestore)) &&
            (event === null
              ? true
              : !event.row.cells[event.col.field].dataInfo.readonly)
        ),
      }).pipe(
        map(({ areEqual, canRestore }) => ({
          current,
          toRestore,
          areEqual,
          canRestore,
        }))
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion VALUES

  //#region LOADING
  public loading$ = merge(
    defer(() => {
      if (!this.cellOverlay) return of(true);
      return this.cellOverlay.onOpen$.pipe(
        take(1),
        map(() => true)
      );
    }),
    this.values$.pipe(map(() => false))
  ).pipe(startWith(false), shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion LOADING

  //#region RESTORING
  public restoring$ = merge(
    this.restore.pipe(map(() => true)),
    merge(
      this.onRestoreSuccess$,
      this.onRestoreError$,
      this.onRestoreCancel$
    ).pipe(map(() => false))
  );
  //#endregion RESTORING
}
