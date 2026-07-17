/** Yeni içerik formu animasyonları. */
import { animate, style, transition, trigger } from '@angular/animations';

export const addDocumentAnimations = [
  trigger('pageEnter', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(8px)' }),
      animate('220ms ease-out', style({ opacity: 1, transform: 'none' })),
    ]),
  ]),
  trigger('brandMenu', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(-4px)' }),
      animate('140ms ease-out', style({ opacity: 1, transform: 'none' })),
    ]),
    transition(':leave', [
      animate('100ms ease-in', style({ opacity: 0, transform: 'translateY(-4px)' })),
    ]),
  ]),
  trigger('fileChip', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0.96)' }),
      animate('160ms ease-out', style({ opacity: 1, transform: 'none' })),
    ]),
  ]),
];
