import {
  AsyncPipe,
  CommonModule,
  NgIf,
  NgTemplateOutlet,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  EventEmitter,
  HostListener,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ImpDialogComponent } from '../imp-dialog/imp-dialog.component';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { injectPost } from '@imperiascm/http';
import {
  ImperiaTableColumn,
  ImperiaTableColumnDataTable,
} from '../imperia-table/models/imperia-table-columns.models';
import { TImperiaTableColumnProperties } from '../imperia-table/models/imperia-table-columns.types';
import { ImperiaTableLoading } from '../imperia-table/models/imperia-table-loading.models';
import {
  getAsyncDataForCellEditingOrColumnFilterTable,
  getImperiaTableColumns,
  onFilterChildImperiaTable,
  onScrollCompleteChildImperiaTable,
  onSearchChildImperiaTable,
  onSortChildImperiaTable,
} from '../imperia-table/shared/functions';
import { BehaviorSubject, Subject } from 'rxjs';
import { ImpTranslateService } from '@imperiascm/translate';
import {
  ImperiaTableFilterSortScrollEvent,
  ImperiaTableV2ClickEvent,
  ScpComponentsModule,
} from '../public-api';
import { createHash } from '@imperiascm/scp-utils/functions';

@Component({
  selector: 'imperia-input-table',
  templateUrl: './imperia-input-table.component.html',
  styleUrls: ['./imperia-input-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ImperiaInputTableComponent,
      multi: true,
    },
  ],
  imports: [
    CommonModule,
    NgIf,
    OverlayPanelModule,
    NgTemplateOutlet,
    ImpDialogComponent,
    AsyncPipe,
    ScpComponentsModule,
  ],
})
export class ImperiaInputTableComponent<TTableItem extends object>
  implements ControlValueAccessor
{
  private readonly post = injectPost();

  @ContentChild('itemSelected')
  public itemSelectedTemplate!: TemplateRef<any>;

  @ContentChild('noItemSelected')
  public noItemSelectedTemplate!: TemplateRef<any>;

  //#region VIEWCHILDS
  @ViewChild(ImpDialogComponent) dialog!: ImpDialogComponent;
  @ViewChild('overlay') overlay!: OverlayPanel;
  //#endregion VIEWCHILDS

  //#region INPUTS
  @Input() container: 'overlay' | 'modal' = 'modal';
  @Input() dataInfo!: ImperiaTableColumnDataTable<TTableItem>;
  @Input() columnsProperties: TImperiaTableColumnProperties<TTableItem>[] = [];
  @Input() columns: ImperiaTableColumn<TTableItem>[] = [];
  @Input() value: TTableItem[] = [];
  @Input() loaded: boolean = false;
  @Input() containerStyle!: Partial<CSSStyleDeclaration>;
  @Input() placeholder: string | null = null;
  //#endregion INPUTS

  //#region OUTPUTS
  @Output() dataInfoChange: EventEmitter<
    ImperiaTableColumnDataTable<TTableItem>
  > = new EventEmitter<ImperiaTableColumnDataTable<TTableItem>>();
  @Output() columnsChange: EventEmitter<ImperiaTableColumn<TTableItem>[]> =
    new EventEmitter<ImperiaTableColumn<TTableItem>[]>();
  @Output() valueChange: EventEmitter<TTableItem[]> = new EventEmitter<
    TTableItem[]
  >();
  @Output() loadedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onAccept: EventEmitter<TTableItem[] | TTableItem | null> =
    new EventEmitter<TTableItem[] | TTableItem | null>();
  //#endregion OUTPUTS

  //#region PUBLIC VARIABLES
  public dataInfo$: Subject<ImperiaTableColumnDataTable<TTableItem>> =
    new Subject<ImperiaTableColumnDataTable<TTableItem>>();
  public columns$: BehaviorSubject<ImperiaTableColumn<TTableItem>[]> =
    new BehaviorSubject<ImperiaTableColumn<TTableItem>[]>([]);
  public value$: BehaviorSubject<TTableItem[]> = new BehaviorSubject<
    TTableItem[]
  >([]);
  public valueToShow: string | null = null;
  public touched: boolean = false;
  public visible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public disabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public selection: TTableItem[] | TTableItem | null = null;
  public tableScrollHeight: string = '0px';
  public tableCaptionVisibility: boolean = false;
  public getAsyncDataForCellEditingOrColumnFilterTable: typeof getAsyncDataForCellEditingOrColumnFilterTable =
    getAsyncDataForCellEditingOrColumnFilterTable;

  public loading = new ImperiaTableLoading(false);
  //#endregion PUBLIC VARIABLES

  //#region PRIVATE VARIABLES
  private onChange = (value: TTableItem[] | TTableItem | null) => {};
  private onTouch = () => {};
  //#endregion PRIVATE VARIABLES

  constructor(public translate: ImpTranslateService) {}

  @HostListener('window:resize', ['$event'])
  setTableScrollHeight() {
    const captionHeight = this.tableCaptionVisibility ? 40 : 0;
    if (this.visible && this.container == 'modal' && this.dialog.content) {
      this.tableScrollHeight =
        this.dialog.content.nativeElement.offsetHeight - captionHeight + 'px';
    } else if (this.container == 'overlay' && this.overlay.container) {
      this.tableScrollHeight =
        this.overlay.container.offsetHeight - captionHeight - 38 + 'px';
    }
  }

  writeValue(value: string | null): void {
    this.valueToShow = value;
  }

  registerOnChange(
    fn: (value: TTableItem[] | TTableItem | null) => void
  ): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.next(isDisabled);
  }

  public emitResizeEvent(source: 'maximize' | 'show' | 'onResizeEnd') {
    let timeout: number = 0;
    if (source === 'maximize') {
      //Hago esto porque si no, la animacion de maximizar y minimizar hace que la tabla no se redimension bien
      timeout = 300;
    }
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, timeout);
  }

  public async onSearch(event: ImperiaTableFilterSortScrollEvent<TTableItem>) {
    await onSearchChildImperiaTable(
      this.post,
      this.dataInfo,
      event,
      this.translate
    );
    this.value$.next(this.dataInfo.value);
    this.valueChange.emit(this.dataInfo.value);
    this.dataInfo$.next(this.dataInfo);
    this.dataInfoChange.emit(this.dataInfo);
  }

  public async onFilter(event: ImperiaTableFilterSortScrollEvent<TTableItem>) {
    await onFilterChildImperiaTable(
      this.post,
      this.dataInfo,
      event,
      this.translate
    );
    this.value$.next(this.dataInfo.value);
    this.valueChange.emit(this.dataInfo.value);
    this.dataInfo$.next(this.dataInfo);
    this.dataInfoChange.emit(this.dataInfo);
  }

  public async onSort(event: ImperiaTableFilterSortScrollEvent<TTableItem>) {
    await onSortChildImperiaTable(
      this.post,
      this.dataInfo,
      event,
      this.translate
    );
    this.value$.next(this.dataInfo.value);
    this.valueChange.emit(this.dataInfo.value);
    this.dataInfo$.next(this.dataInfo);
    this.dataInfoChange.emit(this.dataInfo);
  }

  public async onScrollComplete(
    event: ImperiaTableFilterSortScrollEvent<TTableItem>
  ) {
    await onScrollCompleteChildImperiaTable(
      this.post,
      this.dataInfo,
      event,
      this.translate
    );
    this.value$.next(this.dataInfo.value);
    this.valueChange.emit(this.dataInfo.value);
    this.dataInfo$.next(this.dataInfo);
    this.dataInfoChange.emit(this.dataInfo);
  }

  public async toggleOverlay(event: any, target: HTMLInputElement) {
    this.overlay.toggle(event, target);
    await this.loadData();
  }

  public async openModal() {
    this.visible.next(true);
    await this.loadData();
  }

  public onSelectionChange(event: TTableItem[] | TTableItem | null) {
    this.selection = event;
    if (Array.isArray(this.selection)) {
      this.valueToShow = this.selection
        .map((selectedItem: any) => selectedItem[this.dataInfo.dataLabel])
        .join(', ');
    } else if (!!this.selection) {
      this.valueToShow = (this.selection as any)[this.dataInfo.dataLabel];
    } else {
      this.valueToShow = null;
    }
  }

  public deleteSelection() {
    this.selection = null;
    this.valueToShow = null;
    this.onChange(null);
    this.onTouch();
  }

  public confirmSelection() {
    if (Array.isArray(this.selection)) {
      if (this.dataInfo.fullData == true) {
        this.onChange(this.selection);
      } else {
        const newValue = this.selection.map(
          (selectedItem: any) =>
            selectedItem[
              Array.isArray(this.dataInfo.dataKey)
                ? selectedItem[this.dataInfo.dataKey[0]]
                : this.dataKeyValue(selectedItem)
            ]
        );
        this.onChange(newValue);
      }
      this.onTouch();
    } else if (!!this.selection) {
      if (this.dataInfo.fullData == true) {
        this.onChange(this.selection);
      } else {
        const newValue = Array.isArray(this.dataInfo.dataKey)
          ? (this.selection as any)[this.dataInfo.dataKey[0]]
          : this.dataKeyValue(this.selection);

        this.onChange(newValue);
      }
      this.valueToShow = (this.selection as any)[this.dataInfo.dataLabel];
      this.onTouch();
    } else {
      this.valueToShow = null;
      this.onChange(null);
      this.onTouch();
    }
    this.onAccept.emit(this.selection);
    this.visible.next(false);
    this.overlay?.hide();
  }

  public onRowDblClick(event: ImperiaTableV2ClickEvent<TTableItem>) {
    if (this.dataInfo.selectionMode == 'multiple') return;
    if (this.dataInfo.fullData == true) {
      this.onChange(event.row.data);
    } else {
      const newValue = (event.row.data as any)[this.dataInfo.dataKey];
      this.onChange(newValue);
    }
    this.valueToShow = (event.row.data as any)[this.dataInfo.dataLabel];
    this.onTouch();
    this.visible.next(false);
    this.overlay?.hide();
  }

  public cancelSelection() {
    this.visible.next(false);
    this.overlay?.hide();
  }

  private async loadData() {
    if (!this.loaded) {
      const translation = this.translate.translation[
        this.dataInfo.translationKey
      ] as any;
      this.loadedChange.emit(true);
      this.dataInfo.columns = getImperiaTableColumns(
        this.dataInfo.columnsProperties,
        translation.columns ? translation.columns : translation.table.columns
      );
      this.columns$.next(this.dataInfo.columns);
      this.columnsChange.emit(this.dataInfo.columns);
      //Si la tabla TIENE filtros, la llamada se hace mediante el evento onFilter de la tabla y no aquí
      if (!this.dataInfo.endpoint.hasFilters) {
        await getAsyncDataForCellEditingOrColumnFilterTable(
          this.post,
          this.dataInfo,
          this.translate
        );
        this.value$.next(this.dataInfo.value);
        this.valueChange.emit(this.dataInfo.value);
      }
    } else {
      this.columns$.next(this.columns);
      this.columnsChange.emit(this.columns);
      this.value$.next(this.value);
      this.valueChange.emit(this.value);
    }
    this.dataInfo$.next(this.dataInfo);
    this.dataInfoChange.emit(this.dataInfo);
  }

  public dataKeyValue(item: TTableItem) {
    return Array.isArray(this.dataInfo.dataKey)
      ? createHash(
          this.dataInfo.dataKey.map((key) => (item as any)[key]).join(':')
        )
      : (item as any)[this.dataInfo.dataKey];
  }
}
