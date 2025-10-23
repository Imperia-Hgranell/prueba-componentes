import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type TUNSAVED_DATA = BehaviorSubject<number[]>;
export const UNSAVED_DATA = new InjectionToken<BehaviorSubject<number[]>>(
  'UNSAVED_DATA',
);
export const UNSAVED_DATA_INITIAL_VALUE: TUNSAVED_DATA = new BehaviorSubject<
  number[]
>([]);
