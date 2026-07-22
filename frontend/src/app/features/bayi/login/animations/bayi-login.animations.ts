/** Bayi login sayfa giriş animasyonları. */
import { animate, style, transition, trigger } from '@angular/animations';

export const bayiLoginAnimations = [
  trigger('heroEnter', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateX(-16px)' }),
      animate(
        '500ms cubic-bezier(0.22, 1, 0.36, 1)',
        style({ opacity: 1, transform: 'none' })
      ),
    ]),
  ]),
  trigger('panelEnter', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(16px)' }),
      animate(
        '450ms 80ms cubic-bezier(0.22, 1, 0.36, 1)',
        style({ opacity: 1, transform: 'none' })
      ),
    ]),
  ]),
  trigger('alertEnter', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(-6px)' }),
      animate('220ms ease-out', style({ opacity: 1, transform: 'none' })),
    ]),
  ]),
];
