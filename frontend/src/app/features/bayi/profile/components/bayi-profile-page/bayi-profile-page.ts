/** Bayi profil düzenleme — iletişim bilgileri (GET/PUT /api/users/me). */
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { UserProfileService } from '../../../../../core/services/user-profile.service';
import { joinFullName, splitFullName } from '../../models/bayi-profile.model';

@Component({
  selector: 'app-bayi-profile-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './bayi-profile-page.html',
  styleUrl: '../../styles/bayi-profile-page.scss',
})
export class BayiProfilePage {
  private readonly auth = inject(AuthService);
  private readonly userProfileService = inject(UserProfileService);

  firstName = '';
  lastName = '';
  email = '';
  phone = '';

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');

  readonly dealerName = computed(() => this.auth.currentUser()?.dealerName ?? 'Bayiniz');
  readonly userId = computed(() => this.auth.currentUser()?.id ?? 0);

  get initials(): string {
    const first = this.firstName.trim();
    const last = this.lastName.trim();
    if (first && last) {
      return (first[0] + last[0]).toUpperCase();
    }
    const joined = joinFullName(first, last);
    return joined.slice(0, 2).toUpperCase() || 'BK';
  }

  constructor() {
    this.userProfileService.getMe().subscribe({
      next: (user) => {
        const names = splitFullName(user.name);
        this.firstName = names.firstName;
        this.lastName = names.lastName;
        this.email = user.email;
        this.phone = user.phone ?? '';
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Profil yüklenemedi.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    this.error.set('');
    this.saved.set(false);

    const firstName = this.firstName.trim();
    const lastName = this.lastName.trim();
    const email = this.email.trim();
    const phone = this.phone.trim();

    if (!firstName) {
      this.error.set('Ad alanı zorunludur.');
      return;
    }
    if (!email) {
      this.error.set('E-posta alanı zorunludur.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error.set('Geçerli bir e-posta adresi girin.');
      return;
    }

    this.saving.set(true);

    const name = joinFullName(firstName, lastName);
    this.userProfileService.updateMe({ name, email, phone: phone || null }).subscribe({
      next: (user) => {
        this.auth.updateCurrentUser({ name: user.name, email: user.email });
        this.phone = user.phone ?? '';
        this.saving.set(false);
        this.saved.set(true);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Profil kaydedilemedi.');
        this.saving.set(false);
      },
    });
  }
}
