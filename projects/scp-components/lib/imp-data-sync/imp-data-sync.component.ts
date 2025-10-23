import { CommonModule, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
  OnDestroy,
  Optional,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { BehaviorSubject, filter, merge, tap } from 'rxjs';
import { ImpOverlayService } from '@imperiascm/scp-utils/overlay';
import { LOCALE } from '@imperiascm/scp-utils/functions';
import { ImperiaFormComponent } from '../imperia-form/components/imperia-form/imperia-form.component';
import { ImpLabelComponent } from '../imp-label/imp-label.component';
import { isCanNotBeLessGreaterError } from '../forms/errors/canNotBeLessGreater';
import { ImperiaFormDataSyncAction, ImperiaFormDataSyncState } from '../imperia-form/models/imperia-form.types';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';
import { ImperiaTableComponent } from '../imperia-table/components/imperia-table/imperia-table.component';
import { TUNSAVED_DATA, UNSAVED_DATA } from './unsaved-data.token';
import { ImpTranslateModule, ImpTranslateService } from '@imperiascm/translate';

@Component({
  selector: 'imp-data-sync',
  standalone: true,
  imports: [
    CommonModule,
    ImperiaIconButtonComponent,
    ProgressSpinnerModule,
    ImpTranslateModule,
    ToastModule,
    ImpLabelComponent,
  ],
  providers: [MessageService, DecimalPipe],
  templateUrl: './imp-data-sync.component.html',
  styleUrls: ['./imp-data-sync.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpCrudMessagesComponent<TItem extends object>
  implements OnDestroy
{
  //#region READONLY
  public readonly LOCALE = LOCALE();
  public readonly TRANSLATION =
    this.typedTranslateService.translation.IMP_CRUD_MESSAGES;
  //#endregion READONLY

  //#region VIEWCHILDS
  @ViewChild('statesTemplate', { static: true }) set statesTemplate(
    template: TemplateRef<any>
  ) {
    this.host.dataStatusTemplate = template;
  }
  @ViewChild('formErrorsTemplate', { static: true })
  formErrorsTemplate!: TemplateRef<any>;
  //#endregion VIEWCHILDS

  //#region FORM ERRORS
  public errors: BehaviorSubject<{
    form: string[];
    controls: { label: string; errors: { name: string; value: any }[] }[];
  }> = new BehaviorSubject<{
    form: string[];
    controls: { label: string; errors: { name: string; value: any }[] }[];
  }>({ form: [], controls: [] });
  public get canShowFormErrors() {
    return (
      (this.host instanceof ImperiaTableComponent &&
        this.host.modalToAddRowVisible) ||
      this.host instanceof ImperiaFormComponent
    );
  }
  private formErrorsAlertVisible: boolean = false;
  //#endregion FORM ERRORS

  public get host():
    | ImperiaFormComponent<TItem>
    | ImperiaTableComponent<TItem> {
    return this.impForm || this.impTable;
  }

  private outsideState$: BehaviorSubject<ImperiaFormDataSyncState> =
    new BehaviorSubject<ImperiaFormDataSyncState>('saved');

  @Input() controlStateFromOutside: boolean = false;

  @Input('state') public set stateSetter(value: ImperiaFormDataSyncState) {
    this.outsideState$.next(value);
  }

  public dataSyncState$ = merge(
    this.host.dataSyncState.pipe(filter(() => !this.controlStateFromOutside)),
    this.outsideState$.pipe(filter(() => this.controlStateFromOutside))
  ).pipe(
    tap((state) => {
      this.markAs(state);
    })
  );

  private readonly unsavedDataId: number = new Date().getTime();

  constructor(
    @Optional() private impForm: ImperiaFormComponent<TItem>,
    @Optional() private impTable: ImperiaTableComponent<TItem>,
    @Inject(UNSAVED_DATA)
    private UNSAVED_DATA$: TUNSAVED_DATA,
    private overlayService: ImpOverlayService,
    public typedTranslateService: ImpTranslateService
  ) {
    this.host.setDataSyncState = this.setDataSyncState.bind(this);
  }

  ngOnDestroy(): void {
    this.markAs('saved');
  }

  //#region ERRORS DESCRIPTION REPLACEMENTS
  public replaceMinMaxNumbers(
    message: string,
    actual: string | null,
    num: string | null
  ) {
    return message
      .replace(/{{num}}/g, num ?? '')
      .replace(/{{actual}}/g, actual ?? '');
  }
  //#endregion ERRORS DESCRIPTION REPLACEMENTS

  private setDataSyncState(
    action: ImperiaFormDataSyncAction,
    state: ImperiaFormDataSyncState,
    showMessage: boolean = true,
    detail?: string
  ) {
    this.host.dataSyncState.next(state);
    if (state === 'saved') {
      this.host.form.markAsPristine();
      this.host.form.markAsUntouched();
      this.host.form.updateValueAndValidity();
      if (!showMessage) return;
      //MOSTRAR MENSAJE AQUÃ CUANDO SE DEFINA
    } else if (state === 'error') {
      if (this.canShowFormErrors) {
        this.showFormErrors();
      }
      if (!showMessage) return;
      //MOSTRAR MENSAJE AQUÃ CUANDO SE DEFINA
    }
  }

  private markAs(state: ImperiaFormDataSyncState) {
    const markedAsUnsaved = this.UNSAVED_DATA$.value.includes(
      this.unsavedDataId
    );
    if (state === 'unsaved' && !markedAsUnsaved) {
      this.UNSAVED_DATA$.next(
        this.UNSAVED_DATA$.value.concat(this.unsavedDataId)
      );
    } else if (state === 'saved' && markedAsUnsaved) {
      this.UNSAVED_DATA$.next(
        this.UNSAVED_DATA$.value.filter((f) => f !== this.unsavedDataId)
      );
    }
  }

  private showFormErrors() {
    if (this.formErrorsAlertVisible) return;
    const columnsOrFields = this.getHostColumnsOrFields();
    const controlsWithErrors = Object.entries(this.host.form.controls).filter(
      ([_, control]) => !!control.errors
    );

    const formErrors = Object.entries(this.host.form.errors ?? {}).reduce(
      (formErrors, entry) => {
        if (isCanNotBeLessGreaterError(entry)) {
          return formErrors.concat(
            entry[1].getErrorMessageTranslated(
              this.TRANSLATION.form_validation_errors.canNotBe,
              columnsOrFields
            )
          );
        }
        return formErrors;
      },
      [] as string[]
    );

    if (!controlsWithErrors.length && !formErrors.length) return;

    this.errors.next({
      form: formErrors,
      controls: controlsWithErrors.map(([name, control]) => ({
        label: columnsOrFields.find((col) => col.field == name)?.label ?? name,
        errors: Object.entries(control.errors ?? {}).map(([key, value]) => ({
          name: key,
          value,
        })),
      })),
    });
    this.formErrorsAlertVisible = true;
    this.overlayService
      .alert(this.formErrorsTemplate, {
        title: this.TRANSLATION.form_validation_title_alert,
        minWidth: '600px',
      })
      .then(() => (this.formErrorsAlertVisible = false));
  }

  private getHostColumnsOrFields() {
    return this.host instanceof ImperiaFormComponent
      ? this.host.fields
      : this.host.columns;
  }
}
