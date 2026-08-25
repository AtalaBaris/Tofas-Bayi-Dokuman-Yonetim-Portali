/** Bayi ayarlar — bildirim tercihleri ve hesap kısayolları (kalıcı API entegrasyonlu). */
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { UserProfileService } from '../../../../../core/services/user-profile.service';

@Component({
  selector: 'app-bayi-settings-page',
  imports: [RouterLink],
  templateUrl: './bayi-settings-page.html',
  styleUrl: '../../styles/bayi-settings-page.scss',
})
export class BayiSettingsPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly userProfile = inject(UserProfileService);

  readonly emailNotifications = signal(true);
  readonly documentAlerts = signal(true);
  readonly expiryReminders = signal(true);
  readonly saving = signal(false);

  readonly userName = () => this.auth.currentUser()?.name ?? 'Kullanıcı';
  readonly dealerName = () => this.auth.currentUser()?.dealerName ?? 'Bayiniz';

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.emailNotifications.set(user.emailNotifications ?? true);
      this.documentAlerts.set(user.documentAlerts ?? true);
      this.expiryReminders.set(user.expiryReminders ?? true);
    }

    this.userProfile.getMe().subscribe({
      next: (res) => {
        this.emailNotifications.set(res.emailNotifications ?? true);
        this.documentAlerts.set(res.documentAlerts ?? true);
        this.expiryReminders.set(res.expiryReminders ?? true);
        this.auth.updateCurrentUser(res);
      },
    });
  }

  toggleEmailNotifications(): void {
    const newValue = !this.emailNotifications();
    this.emailNotifications.set(newValue);
    this.savePreferences();
  }

  toggleDocumentAlerts(): void {
    const newValue = !this.documentAlerts();
    this.documentAlerts.set(newValue);
    this.savePreferences();
  }

  toggleExpiryReminders(): void {
    const newValue = !this.expiryReminders();
    this.expiryReminders.set(newValue);
    this.savePreferences();
  }

  private savePreferences(): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.saving.set(true);
    this.userProfile
      .updateMe({
        name: user.name,
        email: user.email,
        phone: user.phone,
        emailNotifications: this.emailNotifications(),
        documentAlerts: this.documentAlerts(),
        expiryReminders: this.expiryReminders(),
      })
      .subscribe({
        next: (updatedUser) => {
          this.saving.set(false);
          this.auth.updateCurrentUser(updatedUser);
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }
}
