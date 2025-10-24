import { InjectionToken } from '@angular/core';
import type { TemplateRef } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import type { BehaviorSubject } from 'rxjs';
import type { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';
import type { ImperiaFormDataSyncState } from '../../imperia-form/models/imperia-form.types';
import type { SetDataSyncFn } from '../../imperia-table/models/imperia-table-outputs.models';

export type ImpCrudMessagesHostType = 'imperia-table' | 'imperia-form';

export interface ImpCrudMessagesHostBase<TItem extends object> {
  readonly hostType: ImpCrudMessagesHostType;
  dataStatusTemplate?: TemplateRef<any> | null;
  dataSyncState: BehaviorSubject<ImperiaFormDataSyncState>;
  form: FormGroup;
  setDataSyncState: SetDataSyncFn;
}

export interface ImpCrudMessagesTableHost<TItem extends object>
  extends ImpCrudMessagesHostBase<TItem> {
  readonly hostType: 'imperia-table';
  modalToAddRowVisible: boolean;
  columns: ImperiaTableColumn<TItem>[];
}

export interface ImpCrudMessagesFormHost<TItem extends object>
  extends ImpCrudMessagesHostBase<TItem> {
  readonly hostType: 'imperia-form';
  fields: ImperiaTableColumn<TItem>[];
}

export type ImpCrudMessagesHost<TItem extends object> =
  | ImpCrudMessagesTableHost<TItem>
  | ImpCrudMessagesFormHost<TItem>;

export const IMP_CRUD_MESSAGES_HOST = new InjectionToken<
  ImpCrudMessagesHost<object>
>('IMP_CRUD_MESSAGES_HOST');

export function isImpCrudMessagesTableHost<TItem extends object>(
  host: ImpCrudMessagesHost<TItem>
): host is ImpCrudMessagesTableHost<TItem> {
  return host.hostType === 'imperia-table';
}

export function isImpCrudMessagesFormHost<TItem extends object>(
  host: ImpCrudMessagesHost<TItem>
): host is ImpCrudMessagesFormHost<TItem> {
  return host.hostType === 'imperia-form';
}
