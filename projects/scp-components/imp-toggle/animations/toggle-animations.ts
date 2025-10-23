import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

export const IMP_TOGGLE = trigger('toggleTrigger', [
  state('off', style({ transform: 'translateX(15%)' })),
  state('on', style({ transform: 'translateX(135%)' })),
  transition('on <=> off', [animate('120ms ease-in-out')]),
]);
