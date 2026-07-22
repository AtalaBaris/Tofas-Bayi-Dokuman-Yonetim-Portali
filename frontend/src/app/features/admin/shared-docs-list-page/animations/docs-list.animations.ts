/** Doküman listesi / drawer animasyonları (kısa — performans için). */
import { animate, style, transition, trigger } from '@angular/animations';

export const docsListAnimations = [
  trigger('drawerSlide', [
    transition(':enter', [
      style({ transform: 'translateX(100%)' }),
      animate('180ms ease-out', style({ transform: 'none' })),
    ]),
    transition(':leave', [
      animate('140ms ease-in', style({ transform: 'translateX(100%)' })),
    ]),
  ]),
  trigger('overlayFade', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('120ms ease-out', style({ opacity: 1 })),
    ]),
    transition(':leave', [animate('100ms ease-in', style({ opacity: 0 }))]),
  ]),
];
