import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  CdkScrollable,
  CdkVirtualScrollViewport,
  ScrollDispatcher,
} from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ImperiaTableFilterSortScrollEvent, ImperiaTableScrollValue } from '../../../imperia-table/models/imperia-table-outputs.models';
import { ImperiaTableFilterValue } from '../../../imperia-table/models/imperia-table-filters.models';
import { ImpInputHelpSearchScrollEvent, ImpInputHelpWriteValueProps } from '../../../imp-input-help-v2/models/imp-input-help.models';
import { IMP_INPUT_HELP_DEFAULT_POSITIONS } from '../../../imp-input-help-v2/models/imp-input-help.constants';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subject,
  combineLatest,
  combineLatestWith,
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  iif,
  map,
  merge,
  scan,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { paginate } from '../../../imperia-table/shared/functions';
import { injectPost } from '@imperiascm/http';
import {
  ImpTranslateService,
  TCompleteTranslation,
} from '@imperiascm/translate';

@Component({
  selector: 'imp-input-help',
  templateUrl: './imp-input-help.component.html',
  styleUrls: ['./imp-input-help.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ImpInputHelpComponent,
      multi: true,
    },
  ],
  standalone: false,
})
export class ImpInputHelpComponent<TItem>
  implements ControlValueAccessor, OnDestroy
{
  private readonly post = injectPost();
  //#region TRANSLATIONS
  public readonly TRANSLATIONS =
    this.typedTranslateService.translation.IMP_INPUT_HELP;
  //#endregion TRANSLATIONS

  //#region OVERLAY
  public overlayRef = this.overlay.create();
  //#endregion OVERLAY

  //#region DROPDOWN
  @ViewChild('dropdown', { static: false }) dropdownTemplate!: TemplateRef<any>;
  private inputContainer = new ReplaySubject<HTMLDivElement>(1);
  @ViewChild('container', { static: false }) set inputContainerSetter(
    v: ElementRef<HTMLDivElement>
  ) {
    if (!v) return;
    this.inputContainer.next(v.nativeElement);
  }
  //#endregion DROPDOWN

  //#region VIRTUAL SCROLL VIEWPORT
  @ViewChild('virtualScrollViewport', { static: false })
  set virtualScrollViewportSetter(v: CdkVirtualScrollViewport | undefined) {
    if (!v) return;
    this.virtualScrollViewport.next(v);
  }
  private virtualScrollViewport: ReplaySubject<CdkVirtualScrollViewport> =
    new ReplaySubject<CdkVirtualScrollViewport>(1);
  //#endregion VIRTUAL SCROLL VIEWPORT

  //#region CONTROL VALUE ACCESSOR
  private onChange = (value: TItem | string) => {};
  private onTouch = () => {};
  @Input('disabled') set disabledSetter(disabled: boolean) {
    this.disabled.next(disabled);
  }
  //#endregion CONTROL VALUE ACCESSOR

  //#region DISABLED
  private disabled: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public disabled$ = this.disabled.pipe(
    tap((disabled) => disabled && this.close()),
    shareReplay(1)
  );
  //#endregion DISABLED

  //#region ALLOW CUSTOM VALUE
  @Input('allowCustomValue') set allowCustomValueSetter(
    allowCustomValue: boolean
  ) {
    this.allowCustomValue.next(allowCustomValue);
  }
  public allowCustomValue: BehaviorSubject<boolean> = new BehaviorSubject(true);
  //#endregion ALLOW CUSTOM VALUE

  //#region ALLOW MULTIPLE VALUES
  @Input('allowMultipleValues') set allowMultipleValuesSetter(
    allowMultipleValues: boolean
  ) {
    this.allowMultipleValues.next(allowMultipleValues);
  }
  public allowMultipleValues: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(true);
  //#endregion ALLOW MULTIPLE VALUES

  //#region ALLOW CLEAR VALUE
  @Input() allowClearValue: boolean = true;
  //#endregion ALLOW CLEAR VALUE

  //#region FULL DATA
  @Input() fullData: boolean = false;
  //#endregion FULL DATA

  //#region SEARCH
  @Input() allowSearch: boolean = true;
  public searching: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public searchValue: Subject<string> = new Subject();
  public searchValue$: Observable<string> = this.searchValue.pipe(
    debounceTime(300),
    tap(() => this.searching.next(true)),
    map((value) => value.trim()),
    distinctUntilChanged(),
    shareReplay(1)
  );
  //#endregion SEARCH

  //#region FILTERS
  @Input('filters') set filtersSetter(
    v: ImperiaTableFilterValue<any, string>[]
  ) {
    this.filters.next(v);
  }
  private filters: BehaviorSubject<ImperiaTableFilterValue<any, string>[]> =
    new BehaviorSubject<ImperiaTableFilterValue<any, string>[]>([]);
  //#endregion FILTERS

  //#region SCROLL
  @Input() pageSize: number = 100;
  public updatingOptionsByScrolling: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public scroll$: Observable<ImperiaTableScrollValue> =
    this.virtualScrollViewport.pipe(
      switchMap((virtualScrollViewport) =>
        virtualScrollViewport.elementScrolled()
      ),
      withLatestFrom(this.updatingOptionsByScrolling),
      map(([event, updating]) => ({ event, updating })),
      filter(({ updating }) => !updating),
      filter(({ event }) =>
        this.isScrollAtBottom(
          event.target as HTMLElement,
          this._lastDropdownOptions
        )
      ),
      filter(() => this.nextPageValid(this._lastDropdownOptions)),
      map(() => ({
        Page: Math.ceil(this._lastDropdownOptions.length / this.pageSize) + 1,
        Size: this.pageSize,
      }))
    );
  //#endregion SCROLL

  //#region EVENTS COMBINED
  public searchCombined$: Observable<ImpInputHelpSearchScrollEvent> =
    this.searchValue$.pipe(
      withLatestFrom(this.filters),
      map(
        ([Search, Filters]) =>
          new ImpInputHelpSearchScrollEvent({
            Search,
            Filters,
            Pagination: { Size: this.pageSize },
          })
      )
    );
  public filtersCombined$: Observable<ImpInputHelpSearchScrollEvent> =
    this.filters.pipe(
      withLatestFrom(this.searchValue$.pipe(startWith(''))),
      map(
        ([Filters, Search]) =>
          new ImpInputHelpSearchScrollEvent({
            Filters,
            Search,
            Pagination: { Size: this.pageSize },
          })
      )
    );
  public scrollCombined$: Observable<ImpInputHelpSearchScrollEvent> =
    this.scroll$.pipe(
      withLatestFrom(this.searchValue$.pipe(startWith('')), this.filters),
      map(
        ([Pagination, Search, Filters]) =>
          new ImpInputHelpSearchScrollEvent({ Pagination, Search, Filters })
      )
    );
  public events$: Observable<ImpInputHelpSearchScrollEvent> = merge(
    this.searchCombined$,
    this.filtersCombined$,
    this.scrollCombined$
  ).pipe(tap(() => (this.loaded = false)));
  //#endregion EVENTS COMBINED

  //#region OVERLAY OPEN
  public openFn = (
    container: HTMLDivElement,
    disabled: boolean,
    loading: boolean
  ) => {
    if (disabled || loading) return;
    this.adaptToContainer(container);
    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
      return;
    }
    this.setCloseEvents(this.overlayRef, this.scrollDispatcher).subscribe();
    this.attach();
  };
  //#endregion OVERLAY OPEN

  //#region OPTIONS
  @Input() optionLabel!:
    | keyof TItem
    | { labels: (keyof TItem)[]; labelSeparator: string };
  @Input() optionValue!: keyof TItem;
  @Input() optionDisabled!: keyof TItem;
  @Input('options') set optionsSetter(options: TItem[]) {
    this.options.next(options);
    this.searching.next(false);
    this.updatingOptionsByScrolling.next(false);
  }
  private options: ReplaySubject<TItem[]> = new ReplaySubject<TItem[]>(1);
  private options$: Observable<TItem[]> = combineLatest([
    this.options,
    this.searchValue$.pipe(startWith('')),
  ]).pipe(
    map(([options, searchValue]) =>
      options.filter((option) =>
        this.getOptionLabel(option, true)
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      )
    ),
    tap(() => this.searching.next(false)),
    shareReplay(1)
  );
  @Input() valueMapper: (
    data: any,
    translation: TCompleteTranslation
  ) => TItem[] = (data) => data;
  //#endregion OPTIONS

  //#region ASYNC OPTIONS
  @Input() async: boolean = true;
  @Input() hasFilters: boolean = true;
  @Input() endpoint!: string;
  @Input('body') set bodySetter(body: string) {
    this.loaded = false;
    this.body.next(body);
  }
  private body: ReplaySubject<string> = new ReplaySubject<string>(1);
  public loaded: boolean = false;
  public asyncOptions$: Observable<TItem[]> = this.overlayRef
    .attachments()
    .pipe(
      filter(() => !this.loaded),
      combineLatestWith(this.events$, this.body),
      filter(() => this.overlayRef.hasAttached()),
      tap(() => this.updatingOptionsByScrolling.next(true)),
      switchMap(([_, event, body]) =>
        this.post(
          this.endpoint,
          this.hasFilters
            ? {
                ...new ImperiaTableFilterSortScrollEvent(event),
                SQLData: body,
              }
            : body
        ).pipe(
          tap(() => (this.loaded = true)),
          map((resp) => ({
            data: resp.ok
              ? this.valueMapper(
                  resp.data,
                  this.typedTranslateService.translation
                )
              : [],
            event: new ImperiaTableFilterSortScrollEvent(event),
          }))
        )
      ),
      scan(
        (acc, { data, event }) => paginate<any>(acc, data, event),
        [] as any[]
      )
    )
    .pipe(
      tap(() => this.updatingOptionsByScrolling.next(false)),
      tap(() => this.searching.next(false))
    );
  //#endregion ASYNC OPTIONS

  //#region PLACEHOLDER
  @Input() placeholder: string = '';
  //#endregion PLACEHOLDER

  //#region ADD QUOTATIONS FOR EXACT FILTER
  @Input() addQuotationsForExactFilter: boolean = false;
  //#endregion ADD QUOTATIONS FOR EXACT FILTER

  //#region WRITE VALUE
  private onWriteValue: ReplaySubject<TItem | TItem[] | null> =
    new ReplaySubject<TItem | TItem[] | null>(1);
  private writedValueProperties$ = this.onWriteValue.pipe(
    map((value) => {
      const isArray = Array.isArray(value);
      const isObject = value instanceof Object && !isArray;
      const isString = typeof value === 'string';
      const isNumber = typeof value === 'number';
      const isInvalid = !isArray && !isObject && !isString;
      return {
        value,
        isArray,
        isEmptyArray: isArray && value.length === 0,
        isObjectsArray: isArray && value[0] instanceof Object,
        isStringsArray: isArray && typeof value[0] === 'string',
        isObject,
        isString,
        isNumber,
        isInvalid,
      };
    }),
    shareReplay(1)
  );
  private valueFromEmptyArray$ = this.writedValueProperties$.pipe(
    filter((props): props is ImpInputHelpWriteValueProps => props.isEmptyArray),
    map(() => ({
      value: '',
      valueToShow: '',
    }))
  );
  private valueFromObjectsArray$ = this.writedValueProperties$.pipe(
    combineLatestWith(this.allowMultipleValues),
    map(([props, allowMultipleValues]) => ({
      ...props,
      allowMultipleValues,
    })),
    filter(
      (props): props is ImpInputHelpWriteValueProps<TItem[], boolean> =>
        props.isObjectsArray
    ),
    map(({ value, allowMultipleValues }) => ({
      value: allowMultipleValues
        ? value.map((v) => v[this.optionValue]).join(';')
        : value[0][this.optionValue] + '',
      valueToShow: allowMultipleValues
        ? value.map((v) => this.toOptionLabel(v, this.optionLabel)).join(';')
        : this.toOptionLabel(value[0], this.optionLabel) + '',
    }))
  );
  private valueFromStringsArray$ = this.writedValueProperties$.pipe(
    combineLatestWith(this.allowMultipleValues),
    map(([props, allowMultipleValues]) => ({
      ...props,
      allowMultipleValues,
    })),
    filter(
      (props): props is ImpInputHelpWriteValueProps<TItem[], boolean> =>
        props.isStringsArray
    ),
    map(({ value, allowMultipleValues }) => ({
      value: allowMultipleValues ? value.join(';') : value[0] + '',
      valueToShow: allowMultipleValues ? value.join(';') : value[0] + '',
    }))
  );
  private valueFromObject$ = this.writedValueProperties$.pipe(
    filter(
      (props): props is ImpInputHelpWriteValueProps<TItem> => props.isObject
    ),
    map(({ value }) => ({
      value: value[this.optionValue] + '',
      valueToShow: this.toOptionLabel(value, this.optionLabel) + '',
    }))
  );
  private valueFromStringOrNumber$ = this.writedValueProperties$.pipe(
    filter(
      (props): props is ImpInputHelpWriteValueProps<TItem> =>
        props.isString || props.isNumber
    ),
    map(({ value }) => ({
      value: value + '',
      valueToShow: value + '',
    }))
  );

  private valueFromInvalidInput$ = this.writedValueProperties$.pipe(
    filter(
      (props): props is ImpInputHelpWriteValueProps<TItem> => props.isInvalid
    ),
    map(({ value }) => ({
      value: '',
      valueToShow: '',
    }))
  );
  //#endregion WRITE VALUE

  //#region INPUT VALUE
  public onInputValueChange: Subject<string> = new Subject();
  public valueFromInput$ = this.onInputValueChange.pipe(
    map((value) => ({
      fullValue: value,
      value,
      valueToShow: value,
    }))
  );
  //#endregion INPUT VALUE

  //#region SELECT VALUE
  public onSelect: Subject<{
    option: TItem;
    currentValue: string;
    currentValueToShow: string;
  }> = new Subject<{
    option: TItem;
    currentValue: string;
    currentValueToShow: string;
  }>();
  public valueFromSelect$ = this.onSelect.pipe(
    filter(({ option }) => !this.isDisabled(option)),
    withLatestFrom(this.allowMultipleValues),
    map(
      ([{ option, currentValue, currentValueToShow }, allowMultipleValues]) => {
        if (!currentValue || !currentValueToShow || !allowMultipleValues) {
          this.close();
          return {
            fullValue: option,
            value: this.getOptionValue(option),
            valueToShow: this.getOptionLabel(option, true),
          };
        }
        if (typeof option === 'string') {
          this.close();
          return {
            fullValue: option,
            value: this.addOption(currentValue, option),
            valueToShow: this.addOption(currentValueToShow, option),
          };
        }
        if (!this.optionLabel || !this.optionValue) {
          console.error(
            'optionLabel and optionValue must be set when using objects as options'
          );
          this.close();
          return { fullValue: option, value: '', valueToShow: '' };
        }

        return {
          fullValue: option,
          value: this.addOption(currentValue, '' + option[this.optionValue]),
          valueToShow: this.addOption(
            currentValueToShow,
            '' + this.toOptionLabel(option, this.optionLabel)
          ),
        };
      }
    )
  );
  //#endregion SELECT VALUE

  //#region MERGE VALUE SOURCES
  private valueFromSources$: Observable<{
    value: string;
    valueToShow: string;
  }> = merge(
    merge(
      this.valueFromEmptyArray$,
      this.valueFromObjectsArray$,
      this.valueFromStringsArray$,
      this.valueFromObject$,
      this.valueFromStringOrNumber$,
      this.valueFromInvalidInput$
    ).pipe(tap(({ value }) => this.valueChanges.emit(value))),
    merge(this.valueFromInput$, this.valueFromSelect$).pipe(
      tap(({ value, fullValue }) => {
        this.onTouch();
        this.onChange(
          this.fullData &&
            !this.allowMultipleValues.value &&
            !this.allowCustomValue.value
            ? (fullValue as TItem)
            : value
        );
        this.valueChanges.emit(
          this.fullData &&
            !this.allowMultipleValues.value &&
            !this.allowCustomValue.value
            ? (fullValue as TItem)
            : value
        );
      })
    )
  ).pipe(shareReplay(1));
  //#endregion MERGE VALUE SOURCES

  //#region VALUE WITH ALLOW MULTIPLE VALUES
  private valueWithAllowMultipleValues$: Observable<{
    value: string;
    valueToShow: string;
  }> = combineLatest([this.valueFromSources$, this.allowMultipleValues]).pipe(
    map(([{ value, valueToShow }, allowMultipleValues]) => ({
      value: allowMultipleValues ? value : value.split(';')[0] ?? '',
      valueToShow: allowMultipleValues
        ? valueToShow
        : valueToShow.split(';')[0] ?? '',
    })),
    shareReplay(1)
  );
  //#endregion VALUE WITH ALLOW MULTIPLE VALUES

  //#region VALUE
  public value$: Observable<string> = this.valueWithAllowMultipleValues$.pipe(
    map(({ value }) => value)
  );
  //#endregion VALUE

  //#region VALUE TO SHOW
  public valueToShow$: Observable<string> =
    this.valueWithAllowMultipleValues$.pipe(
      map(({ valueToShow }) => valueToShow)
    );
  //#endregion VALUE TO SHOW

  //#region DROPDOWN VIEWMODEL
  private _lastDropdownOptions: TItem[] = [];
  public dropdownVM$: Observable<{
    options: TItem[];
    scrollHeight: number;
    loading: boolean;
  }> = iif(() => this.async, this.asyncOptions$, this.options$).pipe(
    tap((options) => (this._lastDropdownOptions = options)),
    map((options) => ({
      options,
      scrollHeight: this.getVirtualScrollHeight(options),
    })),
    combineLatestWith(this.updatingOptionsByScrolling),
    map(([vm, loading]) => ({
      ...vm,
      loading,
    })),
    startWith({
      options: this._lastDropdownOptions,
      scrollHeight: this.getVirtualScrollHeight(this._lastDropdownOptions),
      loading: true,
    }),
    shareReplay(1)
  );
  //#endregion DROPDOWN VIEWMODEL

  //#region OUTPUTS
  @Output('events')
  eventsEmitter: EventEmitter<ImpInputHelpSearchScrollEvent> =
    new EventEmitter<ImpInputHelpSearchScrollEvent>();
  @Output('onPaste') onPasteEmitter: EventEmitter<ClipboardEvent> =
    new EventEmitter<ClipboardEvent>();
  @Output('valueChanges') valueChanges: EventEmitter<string | TItem> =
    new EventEmitter<string | TItem>();
  //#endregion OUTPUTS

  constructor(
    private typedTranslateService: ImpTranslateService,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private scrollDispatcher: ScrollDispatcher,
    private ngZone: NgZone
  ) {}

  ngOnDestroy(): void {
    this.overlayRef.dispose();
  }

  writeValue(value: TItem | TItem[]): void {
    this.onWriteValue.next(value);
  }

  registerOnChange(fn: (value: string | TItem) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.next(isDisabled);
  }

  public close() {
    if (!this.overlayRef.hasAttached()) return;
    this.overlayRef.detach();
  }

  public clearSearch() {
    this.searchValue.next('');
  }

  public getOptionValue(option: TItem): string {
    if (typeof option === 'string')
      return this.addQuotationsForExactFilter
        ? this.addQuotationsToOption(option)
        : option;
    if (!this.optionLabel || !this.optionValue) {
      console.error(
        'optionLabel and optionValue must be set when using objects as options'
      );
      return '';
    }
    return option[this.optionValue] + '';
  }

  public getOptionLabel(
    option: TItem,
    addQuotationsForExactFilter: boolean = false
  ): string {
    if (typeof option === 'string')
      return this.addQuotationsForExactFilter && addQuotationsForExactFilter
        ? this.addQuotationsToOption(option)
        : option;
    if (!this.optionLabel || !this.optionValue) {
      console.error(
        'optionLabel and optionValue must be set when using objects as options'
      );
      return '';
    }
    return this.toOptionLabel(option, this.optionLabel) + '';
  }

  public isDisabled(option: TItem): boolean {
    if (typeof option === 'string') return false;
    if (!this.optionDisabled) return false;
    return !!option[this.optionDisabled];
  }

  private getVirtualScrollHeight(options: TItem[]) {
    const totalHeight = options.length * 29;
    return totalHeight < 29 ? 29 : totalHeight > 400 ? 400 : totalHeight;
  }

  private setCloseEvents(
    overlayRef: OverlayRef,
    scrollDispatcher: ScrollDispatcher
  ) {
    return merge(
      overlayRef.outsidePointerEvents().pipe(tap(() => this.close())),
      scrollDispatcher.scrolled().pipe(
        filter((elementScrolled) =>
          this.shouldCloseOnThisScroll(elementScrolled)
        ),
        tap(() => this.ngZone.run(() => this.close()))
      )
    ).pipe(takeUntil(overlayRef.detachments()));
  }

  private attach() {
    this.overlayRef.attach(new TemplatePortal(this.dropdownTemplate, this.vcr));
  }

  private adaptToContainer(container: HTMLDivElement) {
    this.overlayRef.updateSize({
      width: container.offsetWidth,
    });
    this.overlayRef.updatePositionStrategy(
      this.overlay
        .position()
        .flexibleConnectedTo(container)
        .withPush(false)
        .withFlexibleDimensions(true)
        .withPositions(IMP_INPUT_HELP_DEFAULT_POSITIONS)
    );
  }

  private shouldCloseOnThisScroll(scrolledElement: void | CdkScrollable) {
    if (!scrolledElement) return false;
    return !scrolledElement
      .getElementRef()
      .nativeElement.classList.contains('imp-input-help-virtual-scroll');
  }

  private isScrollAtBottom(target: HTMLElement, options: TItem[]): boolean {
    if (options.length == 0 || target.scrollHeight == 0) return false;
    return (
      target.offsetHeight + target.scrollTop >= target.scrollHeight * 0.9 &&
      !this.updatingOptionsByScrolling.value
    );
  }

  private nextPageValid(options: TItem[]) {
    const Page = options.length / this.pageSize + 1;
    return Number.isInteger(Page);
  }

  private addOption(value: string, option: string) {
    return value
      .concat(
        ';',
        this.addQuotationsForExactFilter
          ? this.addQuotationsToOption(option)
          : option
      )
      .replace(';;', ';');
  }

  public async focus() {
    const input = await firstValueFrom(this.inputContainer);
    const insideInput = input.querySelectorAll('input')[0];
    if (insideInput) {
      insideInput.focus();
      insideInput.click();
    }
  }

  private addQuotationsToOption(option: string): string {
    return `"${option}"`;
  }

  private toOptionLabel(
    item: TItem,
    optionLabel:
      | keyof TItem
      | { labels: (keyof TItem)[]; labelSeparator?: string }
  ): string {
    if (typeof optionLabel === 'object' && 'labelSeparator' in optionLabel) {
      const { labels, labelSeparator } = optionLabel;
      return labels.map((label) => item[label]).join(labelSeparator);
    } else {
      return typeof optionLabel === 'string' ? item[optionLabel] + '' : '';
    }
  }
}
