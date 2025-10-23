import {
  CdkScrollableModule,
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { injectPost } from '@imperiascm/http';
import { FADEIN_FADEOUT } from '@imperiascm/scp-utils/animations';
import {
  ImpInputHelpSearchScrollEvent,
  ImpInputHelpV2Option,
  ImpInputHelpWriteValueProps,
} from '../../models/imp-input-help.models';
import { ImperiaIconButtonComponent } from '../../../imperia-icon-button/imperia-icon-button.component';
import { ImperiaTableFilterValue } from '../../../imperia-table/models/imperia-table-filters.models';
import { ImperiaTableFilterSortScrollEvent, ImperiaTableScrollValue } from '../../../imperia-table/models/imperia-table-outputs.models';
import { paginate } from '../../../imperia-table/shared/functions';
import {
  getClosestCornerToBoundsCenter,
  getCorners,
} from '@imperiascm/scp-utils/functions';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subject,
  combineLatest,
  combineLatestWith,
  debounceTime,
  defer,
  delay,
  distinctUntilChanged,
  filter,
  iif,
  map,
  merge,
  scan,
  shareReplay,
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ImpOverlay } from '@imperiascm/scp-components/imp-overlay';
import {
  FilterPipe,
  ImpDatePipe,
  LocalizedDatePipe,
  StringParsePipe,
} from '@imperiascm/scp-utils/pipes';
import {
  ImpTranslatePipe,
  ImpTranslateService,
  TCompleteTranslation,
} from '@imperiascm/translate';
import { ImpOverlayService } from '@imperiascm/scp-utils/overlay';

@Component({
  selector: 'imp-input-help-v2',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ImperiaIconButtonComponent,
    SkeletonModule,
    CdkScrollableModule,
    ScrollingModule,
    CheckboxModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ImpInputHelpV2Component,
      multi: true,
    },
  ],
  templateUrl: './imp-input-help-v2.component.html',
  styleUrls: ['./imp-input-help-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [FADEIN_FADEOUT],
})
export class ImpInputHelpV2Component<TItem extends object>
  implements ControlValueAccessor, OnDestroy
{
  private readonly post = injectPost();
  //#region TRANSLATIONS
  public readonly TRANSLATIONS =
    this.typedTranslateService.translation.IMP_INPUT_HELP;
  //#endregion TRANSLATIONS

  //#region REGEX
  public VALUE_REGEXP = new RegExp(/"([^";]*?)";/g);
  public NO_QUOTATIONS_VALUE_REGEXP = new RegExp(/([^";]*?);/g);
  //#endregion REGEX

  //#region INPUTS
  @Input() async: boolean = true;
  @Input() hasFilters: boolean = true;
  @Input() endpoint!: string;
  @Input() allowClearValue: boolean = true;
  @Input() allowSearch: boolean = true;
  @Input() pageSize: number = 100;
  @Input() placeholder: string = '';
  @Input() addQuotationsForExactFilter: boolean = false;
  @Input() optionLabel!:
    | keyof TItem
    | { labels: (keyof TItem)[]; labelSeparator: string };
  @Input() optionValue!: keyof TItem;
  @Input() optionDisabled!: keyof TItem;
  @Input('options') set optionsSetter(options: TItem[]) {
    this.options.next(options);
  }
  private options: ReplaySubject<TItem[]> = new ReplaySubject<TItem[]>(1);
  @Input('body') set bodySetter(body: string) {
    this.loaded = false;
    this.body.next(body);
  }
  @Input() valueMapper: (
    data: any,
    translation: TCompleteTranslation
  ) => TItem[] = (data) => data;
  private body: ReplaySubject<string> = new ReplaySubject<string>(1);
  @Input('disabled') set disabledSetter(disabled: boolean) {
    this.disabled.next(disabled);
  }
  private disabled: BehaviorSubject<boolean> = new BehaviorSubject(false);

  @Input('allowCustomValue') set allowCustomValueSetter(
    allowCustomValue: boolean
  ) {
    this.allowCustomValue.next(allowCustomValue);
  }
  public allowCustomValue: BehaviorSubject<boolean> = new BehaviorSubject(true);
  @Input('allowMultipleValues') set allowMultipleValuesSetter(
    allowMultipleValues: boolean
  ) {
    this.allowMultipleValues$.next(allowMultipleValues);
  }
  public allowMultipleValues$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(true);
  public $allowMultipleValues = toSignal(this.allowMultipleValues$);

  @Input('filters') set filtersSetter(
    v: ImperiaTableFilterValue<any, string>[]
  ) {
    this.inputFilters.next(v.length > 0 ? v : []);
  }
  private inputFilters: ReplaySubject<ImperiaTableFilterValue<any, string>[]> =
    new ReplaySubject<ImperiaTableFilterValue<any, string>[]>(1);

  inputFilters$ = this.inputFilters.pipe(
    distinctUntilChanged(
      (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  //#endregion INPUTS

  //#region OUTPUTS
  @Output('events')
  eventsEmitter: EventEmitter<ImpInputHelpSearchScrollEvent> =
    new EventEmitter<ImpInputHelpSearchScrollEvent>();
  @Output('onPaste') onPasteEmitter: EventEmitter<ClipboardEvent> =
    new EventEmitter<ClipboardEvent>();
  @Output('valueChanges') valueChanges: EventEmitter<string> =
    new EventEmitter<string>();
  //#endregion OUTPUTS

  //#region VIEWCHILDS
  @ViewChild('overlay', { static: false })
  overlayTemplate!: TemplateRef<any>;

  @ViewChild('container', { static: false }) set inputContainerSetter(
    v: ElementRef<HTMLDivElement>
  ) {
    if (!v) return;
    this.inputContainer.next(v.nativeElement);
  }
  private inputContainer = new ReplaySubject<HTMLDivElement>(1);

  @ViewChild('virtualScrollViewport', { static: false })
  set virtualScrollViewportSetter(v: CdkVirtualScrollViewport | undefined) {
    if (!v) return;
    this.virtualScrollViewport.next(v);
  }
  private virtualScrollViewport: ReplaySubject<CdkVirtualScrollViewport> =
    new ReplaySubject<CdkVirtualScrollViewport>(1);
  //#endregion VIEWCHILDS

  //#region CONTROL VALUE ACCESSOR
  private onChange = (value: string) => {};
  private onTouch = () => {};
  //#endregion CONTROL VALUE ACCESSOR

  //#region DISABLED
  public disabled$ = this.disabled.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion DISABLED

  //#region SEARCH
  public searchValue: Subject<string> = new Subject();
  public searchValue$: Observable<string> = this.searchValue.pipe(
    debounceTime(300),
    map((value) => value.trim()),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion SEARCH

  //#region SCROLL
  trackByIndex(index: number): number {
    return index;
  }
  public updatingOptionsByScrolling: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public scroll$: Observable<ImperiaTableScrollValue> =
    this.virtualScrollViewport.pipe(
      switchMap((virtualScrollViewport) =>
        virtualScrollViewport.elementScrolled()
      ),
      debounceTime(340),
      withLatestFrom(this.updatingOptionsByScrolling),
      map(([event, updating]) => ({ event, updating })),
      filter(({ updating }) => !updating),
      filter(({ event }) =>
        this.isScrollAtBottom(
          event.target as HTMLElement,
          this._lastDropdownOptions
        )
      ),
      filter(() => this.isNextPageValid(this._lastDropdownOptions)),
      map(() => ({
        Page: Math.ceil(this._lastDropdownOptions.length / this.pageSize) + 1,
        Size: this.pageSize,
      }))
    );
  //#endregion SCROLL

  //#region EVENTS COMBINED
  public searchCombined$: Observable<ImpInputHelpSearchScrollEvent> =
    this.searchValue$.pipe(
      withLatestFrom(this.inputFilters$),
      map(
        ([Search, Filters]) =>
          new ImpInputHelpSearchScrollEvent({
            Search,
            Filters,
            Pagination: { Size: this.pageSize },
          })
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  public filtersCombined$: Observable<ImpInputHelpSearchScrollEvent> =
    this.inputFilters$.pipe(
      withLatestFrom(this.searchValue$.pipe(startWith(''))),
      map(
        ([Filters, Search]) =>
          new ImpInputHelpSearchScrollEvent({
            Filters,
            Search,
            Pagination: { Size: this.pageSize },
          })
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  public scrollCombined$: Observable<ImpInputHelpSearchScrollEvent> =
    this.scroll$.pipe(
      withLatestFrom(this.searchValue$.pipe(startWith('')), this.inputFilters$),
      map(
        ([Pagination, Search, Filters]) =>
          new ImpInputHelpSearchScrollEvent({ Pagination, Search, Filters })
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  public events$: Observable<ImpInputHelpSearchScrollEvent> = merge(
    this.searchCombined$,
    this.filtersCombined$,
    this.scrollCombined$
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion EVENTS COMBINED

  //#region WRITE VALUE
  //todo: nose si se puede eliminar? sirve para lo que viene del LS, poder tratarlo como tal,
  //todo: pero si siempre va a ser un string, no se si tiene sentido
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
    shareReplay({ bufferSize: 1, refCount: true })
  );
  private valueFromEmptyArray$ = this.writedValueProperties$.pipe(
    filter((props): props is ImpInputHelpWriteValueProps => props.isEmptyArray),
    map(() => ({
      value: '',
      valueToShow: '',
    }))
  );
  private valueFromObjectsArray$ = this.writedValueProperties$.pipe(
    combineLatestWith(this.allowMultipleValues$),
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
    combineLatestWith(this.allowMultipleValues$),
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
      value,
      valueToShow: value,
    }))
  );
  //#endregion INPUT VALUE

  //#region DROPDOWN MODAL
  public onOpenDropdownModal: Subject<void> = new Subject();
  public onOpenDropdownModal$ = this.onOpenDropdownModal.pipe(
    withLatestFrom(this.disabled$),
    filter(([_, disabled]) => !disabled),
    map(() => ({
      visible: true,
    }))
  );

  public onCloseDropdownModal: Subject<void> = new Subject();
  public onCloseDropdownModal$ = merge(this.onCloseDropdownModal).pipe(
    map(() => ({
      visible: false,
    }))
  );

  public dropDownModal: Observable<ImpOverlay> = merge(
    this.onOpenDropdownModal$,
    this.onCloseDropdownModal$
  ).pipe(
    withLatestFrom(this.inputContainer),
    map(([{}, inputContainer]) =>
      this.impOverlayService.instance(this.overlayTemplate, inputContainer)
    ),
    filter(
      (dropdownModalInstance): dropdownModalInstance is ImpOverlay =>
        dropdownModalInstance !== null
    ),
    map((dropdownModalInstance) => dropdownModalInstance),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public dropdownModalVisibility$ = this.dropDownModal.pipe(
    switchMap(({ visible$ }) => visible$),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion DROPDOWN MODAL

  //#region SELECT VALUE
  public onSelect: Subject<{
    option: ImpInputHelpV2Option<TItem>;
    currentValue: string;
    currentValueToShow: string;
  }> = new Subject<{
    option: ImpInputHelpV2Option<TItem>;
    currentValue: string;
    currentValueToShow: string;
  }>();
  public valueFromDropDownOptions$ = this.onSelect.pipe(
    filter(({ option }) => !this.isDisabled(option)),
    withLatestFrom(this.allowMultipleValues$),
    map(
      ([{ option, currentValue, currentValueToShow }, allowMultipleValues]) => {
        //the option is an object and no value and label properties are provided
        if (
          typeof option !== 'string' &&
          (!this.optionLabel || !this.optionValue)
        ) {
          console.error('optionLabel and optionValue must provided');
          return { value: '', valueToShow: '' };
        }
        const optValue =
          typeof option.value === 'string'
            ? option.value
            : option.value[this.optionValue] + '';
        const optLabel =
          typeof option.value === 'string'
            ? option.value
            : this.toOptionLabel(option.value, this.optionLabel) + '';

        //only one value is allowed
        if (!allowMultipleValues) {
          option.selected = !option.selected;
          return {
            value: this.addOption('', optValue, allowMultipleValues),
            valueToShow: this.addOption('', optLabel, allowMultipleValues),
          };
        }

        //default behavior

        const value = !option.selected
          ? this.addOption(currentValue, optValue, allowMultipleValues)
          : this.removeOption(currentValue, optValue);

        const valueToShow = !option.selected
          ? this.addOption(currentValueToShow, optLabel, allowMultipleValues)
          : this.removeOption(currentValueToShow, optLabel);

        option.selected = !option.selected;
        return {
          value,
          valueToShow,
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
    merge(this.valueFromInput$, this.valueFromDropDownOptions$).pipe(
      tap(({ value }) => {
        this.onTouch();
        this.onChange(value);
        this.valueChanges.emit(value);
      })
    )
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion MERGE VALUE SOURCES

  //#region VALUE WITH ALLOW MULTIPLE VALUES
  private valueWithAllowMultipleValues$: Observable<{
    value: string;
    valueToShow: string;
  }> = combineLatest([this.valueFromSources$, this.allowMultipleValues$]).pipe(
    map(([{ value, valueToShow }, allowMultipleValues]) => ({
      value: allowMultipleValues ? value : value.split(';')[0] ?? '',
      valueToShow: allowMultipleValues
        ? valueToShow
        : valueToShow.split(';')[0] ?? '',
    })),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion VALUE WITH ALLOW MULTIPLE VALUES

  //#region VALUE
  public value$: Observable<string> = this.valueWithAllowMultipleValues$.pipe(
    map(({ value }) => value),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion VALUE

  //#region OPTIONS
  private options$: Observable<ImpInputHelpV2Option<TItem>[]> = combineLatest([
    this.options,
    this.searchValue$.pipe(startWith('')),
    defer(() => this.value$),
  ]).pipe(
    map(([options, searchValue, currentValue]) =>
      options
        .map(
          (value) =>
            ({
              value,
              label: this.getOptionLabel(value),
              selected: this.isSelected(value, currentValue),
            } as ImpInputHelpV2Option<TItem>)
        )
        .filter(({ value }) =>
          this.getOptionLabel(value, true)
            .toLowerCase()
            .includes(searchValue.toLowerCase())
        )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public loaded: boolean = false;
  public asyncOptions$: Observable<ImpInputHelpV2Option<TItem>[]> =
    this.dropdownModalVisibility$.pipe(
      filter(({ visible }) => {
        this.loaded = !this.async;
        return !!visible && this.async;
      }),
      combineLatestWith(this.events$, this.body),
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
        (acc, { data, event }) =>
          paginate<any>(
            acc,
            data.map((value) => ({
              value,
              label: this.getOptionLabel(value),
              selected: true,
            })),
            event
          ),
        [] as any[]
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  //#endregion ASYNC OPTIONS

  //#region VALUE TO SHOW
  public valueToShow$: Observable<string> =
    this.valueWithAllowMultipleValues$.pipe(
      map(({ valueToShow }) => valueToShow)
    );
  //#endregion VALUE TO SHOW

  //#region DROPDOWN VIEWMODEL
  private _lastDropdownOptions: ImpInputHelpV2Option<TItem>[] = [];
  public dropdownVM$: Observable<{
    options: ImpInputHelpV2Option<TItem>[];
    scrollHeight: number;
    loading: boolean;
  }> = iif(() => this.async, this.asyncOptions$, this.options$).pipe(
    tap((options) => (this._lastDropdownOptions = options)),
    withLatestFrom(this.inputContainer),
    map(([options, inputContainer]) => ({
      options,
      scrollHeight: this.getVirtualScrollHeight(options, inputContainer),
    })),
    combineLatestWith(this.updatingOptionsByScrolling, this.value$),
    map(([vm, loading, value]) => ({
      ...vm,
      options: vm.options.map((option) => ({
        ...option,
        selected: this.isSelected(this.getOptionValue(option.value), value),
      })),
      loading,
    })),
    startWith({
      options: this._lastDropdownOptions,
      scrollHeight: this.getVirtualScrollHeight(this._lastDropdownOptions),
      loading: true,
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion DROPDOWN VIEWMODEL

  //#region LOADING
  public loading$ = merge(
    merge(
      this.events$.pipe(map(() => true)),
      this.searchValue$.pipe(map(() => true))
    ).pipe(
      switchMap(() =>
        this.dropDownModal.pipe(switchMap(({ visible$ }) => visible$))
      ),
      filter(({ visible }) => visible),
      map(() => true)
    ),
    merge(this.asyncOptions$, this.options$).pipe(
      delay(1000),
      map(() => false)
    )
  ).pipe(startWith(false), shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion LOADING

  ngOnDestroy() {
    const modalDestroy = this.dropDownModal.subscribe((modal) =>
      modal.destroy()
    );
    modalDestroy.unsubscribe();
  }
  constructor(
    private typedTranslateService: ImpTranslateService,
    private impOverlayService: ImpOverlayService
  ) {}

  writeValue(value: TItem | TItem[]): void {
    this.onWriteValue.next(value);
  }

  registerOnChange(fn: (value: string | TItem[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
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
    if (typeof option === 'string') {
      return this.addQuotationsForExactFilter && addQuotationsForExactFilter
        ? this.addQuotationsToOption(option)
        : option;
    }
    if (!this.optionLabel || !this.optionValue) {
      console.error(
        'optionLabel and optionValue must be set when using objects as options'
      );
      return '';
    }
    return this.toOptionLabel(option, this.optionLabel) + '';
  }

  public isDisabled(option: ImpInputHelpV2Option<TItem>): boolean {
    if (typeof option === 'string') return false;
    if (!this.optionDisabled) return false;
    return !!option.value[this.optionDisabled];
  }

  public isSelected(
    option: TItem | string,
    currentValue: string | null
  ): boolean {
    if (!currentValue) return false;
    if (typeof option === 'string') {
      return [
        ...currentValue.matchAll(
          this.addQuotationsForExactFilter
            ? this.VALUE_REGEXP
            : this.NO_QUOTATIONS_VALUE_REGEXP
        ),
      ]
        .map((v) => v[1])
        .includes(option.replace(/"/g, ''));
    }
    if (!this.optionValue) {
      console.error('optionValue must be set when using objects as options');
      return false;
    }
    return currentValue.split(';').includes(option[this.optionValue] + '');
  }

  private getVirtualScrollHeight(
    options: TItem[],
    inputContainer?: HTMLDivElement
  ): number {
    const padding = 20;
    const optionHeigth = 29;
    const maxHeight = 300;
    let maxScrollableHeight = maxHeight;
    const totalHeight = options.length * optionHeigth;

    if (!inputContainer)
      return Math.max(optionHeigth, Math.min(totalHeight, maxHeight));

    const inputHeigth = inputContainer.offsetHeight + 8; // 8 is the padding
    const closest = getClosestCornerToBoundsCenter(
      document.documentElement.getBoundingClientRect(),
      getCorners(inputContainer.getBoundingClientRect())
    );

    const overflowOnTop = closest.y - padding - inputHeigth - maxHeight < 0;
    const overflowOnBottom =
      closest.y + padding + inputHeigth + maxHeight > window.innerHeight;

    if (closest.name.includes('top') && overflowOnTop) {
      maxScrollableHeight = closest.y - padding - inputHeigth;
    } else if (closest.name.includes('bottom') && overflowOnBottom) {
      maxScrollableHeight =
        window.innerHeight - closest.y - padding - inputHeigth;
    }

    return Math.max(optionHeigth, Math.min(totalHeight, maxScrollableHeight));
  }

  private isScrollAtBottom(target: HTMLElement, options: TItem[]): boolean {
    if (options.length == 0 || target.scrollHeight == 0) return false;
    return (
      target.offsetHeight + target.scrollTop >= target.scrollHeight * 0.9 &&
      !this.updatingOptionsByScrolling.value
    );
  }

  private isNextPageValid(options: TItem[]) {
    const Page = options.length / this.pageSize + 1;
    return Number.isInteger(Page);
  }

  private addOption(
    value: string,
    option: string,
    allowMultipleValues: boolean
  ): string {
    const formattedOption = this.addQuotationsForExactFilter
      ? this.addQuotationsToOption(option)
      : option;
    return !value
      ? `${formattedOption}` + (allowMultipleValues ? ';' : '')
      : `${value};${formattedOption};`.replace(';;', ';');
  }

  private removeOption(value: string, option: string) {
    const matches = value?.match(
      this.addQuotationsForExactFilter
        ? this.VALUE_REGEXP
        : this.NO_QUOTATIONS_VALUE_REGEXP
    );
    if (!matches) return value;
    return matches
      .filter((v) => v.replace(/;/g, '').replace(/"/g, '') !== option)
      .join('');
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
