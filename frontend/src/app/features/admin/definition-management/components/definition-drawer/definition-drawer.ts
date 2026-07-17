import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFINITION_LABELS, type DefinitionSection } from '../../models/definition-management.model';

export interface DefinitionDrawerSavePayload {
  section: DefinitionSection;
  name: string;
  email: string;
  password: string;
  role: string;
  dealer: string;
  detail: string;
  active: boolean;
}

@Component({
  selector: 'app-definition-drawer',
  imports: [FormsModule],
  templateUrl: './definition-drawer.html',
  styleUrl: '../../styles/definition-drawer.scss',
})
export class DefinitionDrawer {
  readonly section = input.required<DefinitionSection>();
  readonly closed = output<void>();
  readonly saved = output<DefinitionDrawerSavePayload>();

  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly passwordConfirm = signal('');
  readonly role = signal('');
  readonly dealer = signal('');
  readonly detail = signal('');
  readonly active = signal(true);
  readonly showErrors = signal(false);

  readonly passwordsMatch = computed(() => {
    const password = this.password();
    const confirm = this.passwordConfirm();
    if (!password && !confirm) {
      return true;
    }
    return password.length > 0 && password === confirm;
  });

  readonly passwordError = computed(() => {
    if (!this.showErrors()) {
      return null;
    }
    if (!this.password().trim()) {
      return 'Şifre zorunludur.';
    }
    if (!this.passwordConfirm().trim()) {
      return 'Şifre tekrarını giriniz.';
    }
    if (!this.passwordsMatch()) {
      return 'Şifreler eşleşmiyor.';
    }
    return null;
  });

  title(): string {
    const singular: Record<DefinitionSection, string> = {
      users: 'Yeni Kullanıcı Ekle',
      dealers: 'Yeni Bayi Ekle',
      brands: 'Yeni Marka Ekle',
      categories: 'Yeni Kategori Ekle',
    };
    return singular[this.section()];
  }

  simpleNameLabel(): string {
    return `${DEFINITION_LABELS[this.section()].replace(/ler$|lar$/, '')} Adı`;
  }

  setActive(value: boolean): void {
    this.active.set(value);
  }

  save(): void {
    this.showErrors.set(true);

    if (this.section() === 'users') {
      if (
        !this.name().trim() ||
        !this.email().trim() ||
        !this.role().trim() ||
        !this.passwordsMatch() ||
        !this.password().trim()
      ) {
        return;
      }
    } else if (!this.name().trim()) {
      return;
    }

    this.saved.emit({
      section: this.section(),
      name: this.name().trim(),
      email: this.email().trim(),
      password: this.password(),
      role: this.role(),
      dealer: this.dealer(),
      detail: this.detail().trim(),
      active: this.active(),
    });
  }
}
