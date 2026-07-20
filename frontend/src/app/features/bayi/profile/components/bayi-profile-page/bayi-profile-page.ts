/** Bayi profil düzenleme — iletişim bilgileri (mock kayıt). */
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { dealerDisplayName } from '../../../home/models/bayi-home.model';
import {
  joinFullName,
  readBayiProfileExtra,
  splitFullName,
  writeBayiProfileExtra,
} from '../../models/bayi-profile.model';

@Component({
  selector: 'app-bayi-profile-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './bayi-profile-page.html',
  styleUrl: '../../styles/bayi-profile-page.scss',
})
export class BayiProfilePage {
  private readonly auth = inject(AuthService);

  firstName = '';
  lastName = '';
  email = '';
  phone = '';

  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');

  readonly dealerName = computed(() => dealerDisplayName(this.auth.currentUser()?.dealerId));
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
    this.loadForm();
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

    // TODO: PUT /api/users/me
    this.auth.updateCurrentUser({
      name: joinFullName(firstName, lastName),
      email,
    });
    writeBayiProfileExtra({ phone });

    this.saving.set(false);
    this.saved.set(true);
  }

  private loadForm(): void {
    const user = this.auth.currentUser();
    const extra = readBayiProfileExtra();
    const names = splitFullName(user?.name ?? '');

    this.firstName = names.firstName;
    this.lastName = names.lastName;
    this.email = user?.email ?? '';
    this.phone = extra.phone || '+90 532 000 00 00';
  }
}
