import {
  animate,
  animateChild,
  query,
  sequence,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

export const COMPONENT_OPEN_CLOSE = trigger('componentOpenClose', [
  state(
    'open',
    style({
      width: '300px',
      opacity: 1,
    }),
  ),
  transition('closed => open', [
    sequence([
      animate('300ms ease-in-out', style({ width: '300px' })),
      animate('300ms ease-in-out', style({ opacity: 1 })),
    ]),
  ]),
  state(
    'closed',
    style({
      width: 0,
      opacity: 0,
    }),
  ),
  transition('open => closed', [
    sequence([
      animate('300ms ease-in-out', style({ opacity: 0 })),
      animate('300ms ease-in-out', style({ width: 0 })),
    ]),
  ]),
]);

export const PANEL_OPEN_CLOSE = trigger('panelOpenClose', [
  state(
    'open',
    style({
      height: '*',
      opacity: 1,
    }),
  ),
  transition('closed => open', [
    animate('300ms ease-in-out', style({ height: '*', opacity: 1 })),
  ]),
  state(
    'closed',
    style({
      height: 0,
      opacity: 0,
    }),
  ),
  transition('open => closed', [
    animate('300ms ease-in-out', style({ height: 0, opacity: 0 })),
  ]),
]);

export const HORIZONTAL_LIST_ELEMENT_ENTER_LEAVE = trigger(
  'horizontalListElementEnterLeave',
  [
    transition('* => *', [
      query(
        ':enter',
        [
          style({ opacity: 0, height: 0 }),
          sequence([
            animate('150ms ease-in-out', style({ height: '*' })),
            animate('150ms ease-in-out', style({ opacity: 1 })),
          ]),
        ],
        { optional: true },
      ),
      query(
        ':leave',
        [
          style({ opacity: 1, height: '*' }),
          sequence([
            animate('150ms ease-in-out', style({ opacity: 0 })),
            animate('150ms ease-in-out', style({ height: 0 })),
          ]),
        ],
        {
          optional: true,
        },
      ),
    ]),
  ],
);

export const HORIZONTAL_ELEMENT_ENTER_LEAVE = trigger(
  'horizontalElementEnterLeave',
  [
    transition(':enter', [
      style({ opacity: 0, height: 0 }),
      sequence([
        animate('250ms ease-in-out', style({ height: '*' })),
        animate('250ms ease-in-out', style({ opacity: 1 })),
      ]),
    ]),
    transition(':leave', [
      style({ opacity: 1, height: '*' }),
      sequence([
        animate('250ms ease-in-out', style({ opacity: 0 })),
        animate('250ms ease-in-out', style({ height: 0 })),
      ]),
    ]),
  ],
);

export const CONTEXT_MENU_ENTER_LEAVE = trigger('contextMenuEnterLeave', [
  transition(':enter', [
    style({ height: 0, opacity: 0 }),
    sequence(
      [
        animate('200ms ease-in-out', style({ height: '*', opacity: 1 })),
        query('@fadeInOut', animateChild(), { optional: true }),
      ],
      { delay: 100 },
    ),
  ]),
  transition(':leave', [
    style({ height: '*', opacity: 1 }),
    sequence(
      [
        query('@fadeInOut', animateChild(), { optional: true }),
        animate('100ms ease-in-out', style({ height: 0, opacity: 0 })),
      ],
      { delay: 100 },
    ),
  ]),
]);

export const FADE_IN_OUT = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('200ms ease-in-out', style({ opacity: 1 })),
  ]),
  transition(':leave', [
    style({ opacity: 1 }),
    animate('100ms ease-in-out', style({ opacity: 0 })),
  ]),
]);
