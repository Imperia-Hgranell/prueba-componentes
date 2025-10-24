import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  forwardRef,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ImperiaFormMenuTemplateDirective } from '../../directives/imperia-form-menu-template.directive';
import { ImperiaFormTemplateDirective } from '../../directives/imperia-form-template.directive';
import { ImperiaFormOnFormCreate, ImperiaFormOnSave, ImperiaFormValueChanges } from '../../models/imperia-form-outputs';
import { ImperiaFormDataSyncState, ImperiaFormTemplateContext } from '../../models/imperia-form.types';
import { ImperiaTableColumn } from '../../../imperia-table/models/imperia-table-columns.models';
import { TImperiaTableColumnField } from '../../../imperia-table/models/imperia-table-columns.types';
import { SetDataSyncFn } from '../../../imperia-table/models/imperia-table-outputs.models';
import { UTC } from '@imperiascm/scp-utils/functions';
import dayjs from 'dayjs/esm';
import {
  BehaviorSubject,
  ReplaySubject,
  distinctUntilChanged,
  map,
  merge,
  pairwise,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {
  IMP_CRUD_MESSAGES_HOST,
  type ImpCrudMessagesFormHost,
} from '../../../shared/template-apis/imp-crud-messages.tokens';

@Component({
  selector: 'imperia-form',
  templateUrl: './imperia-form.component.html',
  styleUrls: ['./imperia-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [
    {
      provide: IMP_CRUD_MESSAGES_HOST,
      useExisting: forwardRef(() => ImperiaFormComponent),
    },
  ],
})
export class ImperiaFormComponent<TItem extends object>
  implements ImpCrudMessagesFormHost<TItem>
{
  public readonly hostType = 'imperia-form' as const;
  //#region ImpCrudMessagesComponent
  public dataStatusTemplate: TemplateRef<any> | null = null;
  public setDataSyncState: SetDataSyncFn = () =>
    console.error(
      'setDataSyncState is not defined - Check if <imp-data-sync></imp-data-sync> is inside <imperia-form></imperia-form>'
    );
  public dataSyncState: BehaviorSubject<ImperiaFormDataSyncState> =
    new BehaviorSubject<ImperiaFormDataSyncState>('saved');
  //#endregion ImpCrudMessagesComponent

  //#region MENU TEMPLATE
  @ContentChild(ImperiaFormMenuTemplateDirective, { read: TemplateRef })
  set menuTemplateSetter(
    template: TemplateRef<ImperiaFormTemplateContext<TItem>>
  ) {
    this.menuTemplate.next(template);
  }
  public menuTemplate: ReplaySubject<
    TemplateRef<ImperiaFormTemplateContext<TItem>>
  > = new ReplaySubject<TemplateRef<ImperiaFormTemplateContext<TItem>>>(1);
  //#endregion MENU TEMPLATE

  //#region FORM TEMPLATE
  @ContentChild(ImperiaFormTemplateDirective, { read: TemplateRef })
  set formTemplateSetter(
    template: TemplateRef<ImperiaFormTemplateContext<TItem>>
  ) {
    this.formTemplate.next(template);
  }
  public formTemplate: ReplaySubject<
    TemplateRef<ImperiaFormTemplateContext<TItem>>
  > = new ReplaySubject<TemplateRef<ImperiaFormTemplateContext<TItem>>>(1);
  //#endregion FORM TEMPLATE

  //#region SAVE
  @Input() public showSaveButton: boolean = true;
  @Output('onSave')
  public onSaveEmitter: EventEmitter<ImperiaFormOnSave<TItem>> =
    new EventEmitter<ImperiaFormOnSave<TItem>>();
  //#endregion SAVE

  //#region ONLY TEMPLATE
  @Input() onlyShowTemplate: boolean = false;
  //#endregion ONLY TEMPLATE

  //#region HEIGHT
  @Input() height: string = 'calc(100vh - 192px)';
  //#endregion HEIGHT

  //#region FORM
  public form: FormGroup<any> = new FormGroup<any>({});
  @Output('onFormCreate')
  public onFormCreateEmitter: EventEmitter<ImperiaFormOnFormCreate<TItem>> =
    new EventEmitter<ImperiaFormOnFormCreate<TItem>>();
  //#endregion FORM

  //#region FIELDS
  public fields: ImperiaTableColumn<TItem>[] = [];
  @Input('fields') set fieldsSetter(newFields: ImperiaTableColumn<TItem>[]) {
    this.removeControlsFromForm(this.fields, newFields, this.form);
    this.addControlsToForm(this.fields, newFields, this.form);

    this.fields = newFields;
    this.fields$.next(newFields);

    this.form.patchValue(this.item);
    this.onFormCreateEmitter.emit({
      form: this.form,
      item: this.item,
      setDataSyncState: this.setDataSyncState.bind(this),
    });
  }
  public fields$: ReplaySubject<ImperiaTableColumn<TItem>[]> =
    new ReplaySubject<ImperiaTableColumn<TItem>[]>(1);
  public updateFields = (
    newFields: ImperiaTableColumn<TItem>[],
    mode: 'concat' | 'set' = 'concat'
  ) => {
    if (mode === 'concat') {
      this.fieldsSetter = this.fields.concat(newFields);
    } else {
      this.fieldsSetter = newFields;
    }
  };
  public removeFields = (fieldsToRemove: TImperiaTableColumnField<TItem>[]) => {
    this.fieldsSetter = this.fields.filter(
      ({ field }) => !fieldsToRemove.includes(field)
    );
  };
  //#endregion FIELDS

  //#region ITEM
  @Input('item') set itemSetter(v: TItem) {
    this.item = v;
    this.form.patchValue(this.item);
    this.item$.next(v);
    this.fields.forEach((field) => {
      if (this.isDateAndHasValue(this.item, field)) {
        this.assertsIsDate(this.item, field);
        this.form.controls[field.field].patchValue(
          dayjs(this.item[field.field] as any).toDate()
        );
      }
    });
  }
  public item$: ReplaySubject<TItem> = new ReplaySubject<TItem>(1);
  public item: TItem = {} as TItem;
  //#endregion ITEM

  //#region FORM VALUE CHANGES
  @Output('valueChanges') public valueChangesEmitter: EventEmitter<
    ImperiaFormValueChanges<TItem>
  > = new EventEmitter<ImperiaFormValueChanges<TItem>>();
  public formValueChanges$ = this.fields$.pipe(
    switchMap((fields) =>
      merge(
        ...fields.map(({ field }) =>
          this.form.controls[field].valueChanges.pipe(
            startWith(this.form.controls[field].value),
            distinctUntilChanged(),
            pairwise(),
            map(([oldValue, newValue]) => ({ field, oldValue, newValue }))
          )
        )
      )
    ),
    tap(({ field, oldValue, newValue }) =>
      setTimeout(() =>
        this.valueChangesEmitter.emit({
          field,
          oldValue: { ...this.form.value, [field]: oldValue },
          newValue: { ...this.form.value, [field]: newValue },
          form: this.form,
          setDataSyncState: this.setDataSyncState.bind(this),
        })
      )
    ),
    tap(() => this.dataSyncState.next(this.form.dirty ? 'unsaved' : 'saved')),
    shareReplay(1)
  );
  //#endregion FORM VALUE CHANGES

  //#region EDITABLE
  @Input() public showEditButton: boolean = true;
  public editableChangeFn: (editable: boolean) => void = (editable) => {
    this.editableSetter = editable;
    this.editableChange.emit(editable);
  };
  @Input('editable') public set editableSetter(editable: boolean) {
    this.editable = editable;
    this.fields.forEach((field) => {
      if (
        editable &&
        !field.dataInfo.readonly &&
        !field.dataInfo.startDisabled
      ) {
        this.form.controls[field.field].enable({ emitEvent: false });
      } else {
        field.dataInfo.startDisabled = false;
        this.form.controls[field.field].disable({ emitEvent: false });
      }
    });
  }
  public editable: boolean = false;
  @Output()
  public editableChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  //#endregion EDITABLE

  constructor() {}

  public onClickEditable() {
    this.editable = !this.editable;
    this.editableChange.emit(this.editable);
  }

  public save(
    fields: ImperiaTableColumn<TItem>[],
    form: FormGroup,
    item: TItem | null
  ) {
    for (const col of fields) {
      if (!this.isDateAndHasValue(form.value, col)) continue;
      const field = form.controls[col.field];
      field.setValue(UTC(field.value as Date), { emitEvent: false });
    }
    this.dataSyncState.next('saving');
    this.onSaveEmitter.emit({
      form: form,
      item: item ?? ({} as TItem),
      setDataSyncState: this.setDataSyncState.bind(this),
    });
  }

  private removeControlsFromForm(
    oldFields: ImperiaTableColumn<TItem>[],
    newFields: ImperiaTableColumn<TItem>[],
    form: FormGroup
  ) {
    const fieldsToRemove = oldFields.filter(
      ({ field }) => !newFields.map(({ field }) => field).includes(field)
    );
    fieldsToRemove.forEach(({ field }) => form.removeControl(field));
  }

  public addControlsToForm(
    oldFields: ImperiaTableColumn<TItem>[],
    newFields: ImperiaTableColumn<TItem>[],
    form: FormGroup
  ) {
    const fieldsToAdd = newFields.filter(
      ({ field }) => !oldFields.map(({ field }) => field).includes(field)
    );
    fieldsToAdd.forEach(({ field, dataInfo }) =>
      form.setControl(
        field,
        new FormControl(
          { value: dataInfo.defaultValue, disabled: dataInfo.startDisabled },
          dataInfo.formValidations
        )
      )
    );
  }

  private assertsIsDate(
    item: TItem,
    col: ImperiaTableColumn<TItem>
  ): asserts item is TItem & { [key in keyof TItem]: Date } {
    if (col.dataInfo.type != 'date') {
      console.error(`The field ${col.field} is not a date`);
    }
  }

  private isDateAndHasValue(
    item: TItem,
    col: ImperiaTableColumn<TItem>
  ): boolean {
    return col.dataInfo.type === 'date' && !!item[col.field];
  }
}
