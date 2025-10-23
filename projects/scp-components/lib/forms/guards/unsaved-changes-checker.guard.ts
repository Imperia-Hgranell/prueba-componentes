import { Injectable, isDevMode } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { ImpOverlayService } from '@imperiascm/scp-utils/overlay';
import { ImpTranslateService } from '@imperiascm/translate';
import { firstValueFrom, Observable } from 'rxjs';

export interface UnsavedChangesCheck<TComponent = any> {
  isUnsaved(
    component: TComponent
  ): boolean | Promise<boolean> | Observable<boolean>;
  save: () => void;
  saved(component: TComponent): Promise<boolean> | Observable<boolean>;
  unsavedMessage?: () => string;
}

@Injectable({
  providedIn: 'root',
})
export class UnsavedChangesCheckerGuard<TComponent extends UnsavedChangesCheck>
  implements CanDeactivate<TComponent>
{
  constructor(
    private overlayService: ImpOverlayService,
    private typedTranslateService: ImpTranslateService
  ) {}

  async canDeactivate(component: TComponent): Promise<boolean> {
    if (!component.isUnsaved || !component.saved) {
      if (isDevMode()) {
        console.warn(
          `The component ${component.constructor.name} has not implemented the UnsavedChangesCheck interface.`
        );
      }
      return true;
    }

    const hasUnsavedChanges = await this.resolve(
      component.isUnsaved(component)
    );

    if (!hasUnsavedChanges) return true;

    const translations =
      this.typedTranslateService.translation.FORMS.unsaved_changes;

    let saved: boolean = false;
    let isRetry = false;

    do {
      const resp = await this.overlayService.saveChanges(
        !!component.unsavedMessage
          ? component.unsavedMessage()
          : translations.messages.hasUnsavedChanges,
        isRetry
          ? {
              maxWidth: '30%',
              minWidth: '30%',
              btnSaveAndExit: translations.buttons.saveButtonPostError,
            }
          : { maxWidth: '30%', minWidth: '30%' }
      );
      if (resp === 0) return false;
      if (resp === 1) return true;

      if (resp === 2) {
        setTimeout(() => component.save(), 0);
        saved = await this.resolve(component.saved(component));
      }

      if (!saved) {
        isRetry = true;
      }
    } while (!saved);

    return true;
  }

  private async resolve<T>(value: T | Observable<T> | Promise<T>) {
    if (value instanceof Observable) {
      return await firstValueFrom(value);
    }
    if (value instanceof Promise) {
      return value;
    }
    return Promise.resolve(value);
  }
}
