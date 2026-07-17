import { animate, style, transition, trigger } from '@angular/animations';

export const definitionManagementAnimations = [
  trigger('drawer', [
    transition(':enter', [
      style({ transform: 'translateX(100%)' }),
      animate('220ms ease-out', style({ transform: 'none' })),
    ]),
    transition(':leave', [
      animate('160ms ease-in', style({ transform: 'translateX(100%)' })),
    ]),
  ]),
  trigger('fade', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('140ms ease-out', style({ opacity: 1 })),
    ]),
    transition(':leave', [animate('100ms ease-in', style({ opacity: 0 }))]),
  ]),
];
