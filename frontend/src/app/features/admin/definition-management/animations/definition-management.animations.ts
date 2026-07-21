import { animate, style, transition, trigger } from '@angular/animations';

/** Hafif overlay fade — blur yok; transform GPU’da kalsın. */
export const definitionManagementAnimations = [
  trigger('drawer', [
    transition(':enter', [
      style({ transform: 'translate3d(100%, 0, 0)' }),
      animate(
        '180ms cubic-bezier(0.22, 1, 0.36, 1)',
        style({ transform: 'translate3d(0, 0, 0)' })
      ),
    ]),
    transition(':leave', [
      animate(
        '120ms cubic-bezier(0.4, 0, 1, 1)',
        style({ transform: 'translate3d(100%, 0, 0)' })
      ),
    ]),
  ]),
  trigger('fade', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('120ms ease-out', style({ opacity: 1 })),
    ]),
    transition(':leave', [animate('80ms ease-in', style({ opacity: 0 }))]),
  ]),
];
