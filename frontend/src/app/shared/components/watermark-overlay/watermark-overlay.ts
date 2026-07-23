import { Component, computed, inject, input } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-watermark-overlay',
  standalone: true,
  templateUrl: './watermark-overlay.html',
  styleUrl: './watermark-overlay.scss',
})
export class WatermarkOverlay {
  private readonly auth = inject(AuthService);

  readonly customText = input<string>('');

  readonly userName = computed(() => this.auth.currentUser()?.name ?? 'Kullanıcı');
  readonly userEmail = computed(() => this.auth.currentUser()?.email ?? '');
  readonly dealerName = computed(() => this.auth.currentUser()?.dealerName ?? 'Bayi');

  readonly formattedDate = computed(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  readonly watermarkText = computed(() => {
    if (this.customText()) {
      return this.customText();
    }
    return `${this.dealerName()} · ${this.userEmail()} · ${this.formattedDate()} · GİZLİ & KİŞİYE ÖZEL`;
  });

  readonly tiles = Array.from({ length: 16 });
}
