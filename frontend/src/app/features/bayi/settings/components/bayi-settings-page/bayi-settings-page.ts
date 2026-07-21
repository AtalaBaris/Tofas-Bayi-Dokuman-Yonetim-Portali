/** Bayi ayarlar — bildirim tercihleri ve hesap kısayolları (mock). */
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-bayi-settings-page',
  imports: [RouterLink],
  templateUrl: './bayi-settings-page.html',
  styleUrl: '../../styles/bayi-settings-page.scss',
})
export class BayiSettingsPage {
  private readonly auth = inject(AuthService);

  readonly emailNotifications = signal(true);
  readonly documentAlerts = signal(true);
  readonly expiryReminders = signal(true);

  readonly userName = () => this.auth.currentUser()?.name ?? 'Kullanıcı';
  readonly dealerName = () => this.auth.currentUser()?.dealerName ?? 'Bayiniz';

  toggleEmailNotifications(): void {
    this.emailNotifications.update((value) => !value);
  }

  toggleDocumentAlerts(): void {
    this.documentAlerts.update((value) => !value);
  }

  toggleExpiryReminders(): void {
    this.expiryReminders.update((value) => !value);
  }
}
