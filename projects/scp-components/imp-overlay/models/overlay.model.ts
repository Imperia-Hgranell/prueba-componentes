import { ComponentRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ImpOverlayComponent } from '../imp-overlay.component';

export interface TemplateContext<T = any> {
  $implicit?: T;
  [key: string]: any;
}
export interface ImpOverlay {
  embeddedView: ComponentRef<ImpOverlayComponent>;
  onDestroyed$: Subject<void>;
  visible$: Observable<{ visible: boolean }>;
  referenceElement: HTMLElement;
  destroy: () => void;
}
