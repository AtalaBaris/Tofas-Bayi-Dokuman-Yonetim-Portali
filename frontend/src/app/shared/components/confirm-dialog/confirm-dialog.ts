/** Uygulama genelinde tekrar kullanılabilir onay modalı. */
import { Component, input, output } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  animations: [
    trigger('overlay', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('140ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('100ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('panel', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px) scale(0.98)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'none' })),
      ]),
      transition(':leave', [
        animate('120ms ease-in', style({ opacity: 0, transform: 'translateY(6px) scale(0.98)' })),
      ]),
    ]),
  ],
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly title = input('İşlemi onayla');
  readonly message = input('Bu işlem geri alınamaz.');
  readonly confirmLabel = input('Sil');
  readonly cancelLabel = input('Vazgeç');
  /** true: kırmızı silme stili (varsayılan). */
  readonly danger = input(true);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onOverlayClick(): void {
    this.cancelled.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onConfirm(): void {
    this.confirmed.emit();
  }
}
