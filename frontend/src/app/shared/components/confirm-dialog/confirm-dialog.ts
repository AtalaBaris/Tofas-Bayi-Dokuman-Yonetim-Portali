/** Uygulama genelinde tekrar kullanılabilir onay modalı. */
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  standalone: true,
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
  /** Opsiyonel orta aksiyon (ör. Yeni Kullanıcı Ekle). */
  readonly secondaryLabel = input<string | null>(null);
  /**
   * Doluysa onay kutusu gösterilir; işaretlenmeden confirm disabled kalır.
   * Okumadan yanlışlıkla onaylamayı engeller.
   */
  readonly acknowledgeLabel = input<string | null>(null);
  /** true: kırmızı silme stili (varsayılan). */
  readonly danger = input(true);
  readonly showHint = input(true);

  readonly confirmed = output<void>();
  readonly secondaryConfirmed = output<void>();
  readonly cancelled = output<void>();

  readonly acknowledged = signal(false);

  readonly canConfirm = computed(() => {
    const label = this.acknowledgeLabel();
    return !label || this.acknowledged();
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.acknowledged.set(false);
      }
    });
  }

  onOverlayClick(): void {
    this.cancelled.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSecondary(): void {
    this.secondaryConfirmed.emit();
  }

  onAcknowledgeChange(checked: boolean): void {
    this.acknowledged.set(checked);
  }

  onConfirm(): void {
    if (!this.canConfirm()) {
      return;
    }
    this.confirmed.emit();
  }
}
