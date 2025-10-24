import { CommonModule, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Host,
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
import { ImpLabelComponent } from '../imp-label/imp-label.component';
import { isCanNotBeLessGreaterError } from '../forms/errors/canNotBeLessGreater';
import { ImperiaFormDataSyncAction, ImperiaFormDataSyncState } from '../imperia-form/models/imperia-form.types';
import { ImperiaIconButtonComponent } from '../imperia-icon-button/imperia-icon-button.component';
import { TUNSAVED_DATA, UNSAVED_DATA } from './unsaved-data.token';
import { ImpTranslateModule, ImpTranslateService } from '@imperiascm/translate';
import {
  IMP_CRUD_MESSAGES_HOST,
  type ImpCrudMessagesHost,
  isImpCrudMessagesFormHost,
  isImpCrudMessagesTableHost,
} from '../shared/template-apis/imp-crud-messages.tokens';
import type { Observable } from 'rxjs';

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
    if (this.hostRef) {
      this.host.dataStatusTemplate = template;
    }
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
    if (!this.hostRef) return false;
    if (isImpCrudMessagesTableHost(this.host)) {
      return this.host.modalToAddRowVisible;
    }
    return isImpCrudMessagesFormHost(this.host);
  }
  private formErrorsAlertVisible: boolean = false;
  //#endregion FORM ERRORS

  private hostRef?: ImpCrudMessagesHost<TItem>;
  private get host(): ImpCrudMessagesHost<TItem> {
    if (!this.hostRef) {
      throw new Error(
        'ImpCrudMessagesComponent must be used inside an ImperiaForm or ImperiaTable host'
      );
    }
    return this.hostRef;
  }

  private outsideState$: BehaviorSubject<ImperiaFormDataSyncState> =
    new BehaviorSubject<ImperiaFormDataSyncState>('saved');

  @Input() controlStateFromOutside: boolean = false;

  @Input('state') public set stateSetter(value: ImperiaFormDataSyncState) {
    this.outsideState$.next(value);
  }

  public dataSyncState$!: Observable<ImperiaFormDataSyncState>;

  private readonly unsavedDataId: number = new Date().getTime();

  constructor(
    @Optional()
    @Host()
    @Inject(IMP_CRUD_MESSAGES_HOST)
    host: ImpCrudMessagesHost<TItem> | null,
    @Inject(UNSAVED_DATA)
    private UNSAVED_DATA$: TUNSAVED_DATA,
    private overlayService: ImpOverlayService,
    public typedTranslateService: ImpTranslateService
  ) {
    this.hostRef = host ?? undefined;
    if (this.hostRef) {
      this.host.setDataSyncState = this.setDataSyncState.bind(this);
      this.dataSyncState$ = merge(
        this.host.dataSyncState.pipe(
          filter(() => !this.controlStateFromOutside)
        ),
        this.outsideState$.pipe(filter(() => this.controlStateFromOutside))
      ).pipe(
        tap((state) => {
          this.markAs(state);
        })
      );
    } else {
      this.dataSyncState$ = this.outsideState$.pipe(
        tap((state) => this.markAs(state))
      );
    }
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
    if (isImpCrudMessagesFormHost(this.host)) {
      return this.host.fields;
    }
    return this.host.columns;
  }
}
