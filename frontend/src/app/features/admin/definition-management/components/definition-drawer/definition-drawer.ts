import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { BrandDto, DealerDto } from '../../../../../core/models/definition.models';
import {
  DEFINITION_LABELS,
  ROLE_OPTIONS,
  type DefinitionSection,
  type DefinitionUser,
  type SimpleDefinitionItem,
} from '../../models/definition-management.model';

export interface DefinitionDrawerSavePayload {
  section: DefinitionSection;
  id: number | null;
  name: string;
  email: string;
  password: string;
  role: string;
  dealerId: number | null;
  code: string;
  city: string;
  phone: string;
  contactInfo: string;
  description: string;
  brandIds: number[];
  active: boolean;
  badgeLabel: string;
  badgeColor: string;
  /** Yalnızca yeni bayi oluştururken dolu. */
  initialUser: {
    name: string;
    email: string;
    password: string;
  } | null;
}

export type DefinitionEditTarget =
  | { kind: 'user'; item: DefinitionUser }
  | { kind: 'item'; item: SimpleDefinitionItem }
  | null;

@Component({
  selector: 'app-definition-drawer',
  imports: [FormsModule],
  templateUrl: './definition-drawer.html',
  styleUrl: '../../styles/definition-drawer.scss',
})
export class DefinitionDrawer {
  readonly section = input.required<DefinitionSection>();
  readonly editTarget = input<DefinitionEditTarget>(null);
  /** Yeni kullanıcı formu açılırken rol/bayi ön seçimi (ör. kullanıcıssız bayi kurtarma). */
  readonly createPreset = input<{ role: string; dealerId: number } | null>(null);
  readonly dealers = input<DealerDto[]>([]);
  readonly brands = input<BrandDto[]>([]);
  readonly saving = input(false);
  readonly formError = input<string | null>(null);

  readonly closed = output<void>();
  readonly saved = output<DefinitionDrawerSavePayload>();

  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly passwordConfirm = signal('');
  readonly role = signal('');
  readonly dealerId = signal<number | null>(null);
  readonly code = signal('');
  readonly city = signal('');
  readonly phone = signal('');
  readonly contactInfo = signal('');
  readonly description = signal('');
  readonly brandIds = signal<number[]>([]);
  readonly active = signal(true);
  readonly showErrors = signal(false);
  readonly badgeLabel = signal('');
  readonly badgeColor = signal('#374151');

  readonly badgeColorPresets = [
    '#1E3A8A',
    '#14532D',
    '#7C2D12',
    '#9F1239',
    '#6B21A8',
    '#0F766E',
    '#374151',
    '#1F2937',
  ] as const;

  /** Yeni bayi oluştururken zorunlu ilk kullanıcı. */
  readonly initialUserName = signal('');
  readonly initialUserEmail = signal('');
  readonly initialUserPassword = signal('');
  readonly initialUserPasswordConfirm = signal('');

  readonly roleOptions = ROLE_OPTIONS;
  readonly isEdit = computed(() => this.editTarget() !== null);

  readonly passwordsMatch = computed(() => {
    const password = this.password();
    const confirm = this.passwordConfirm();
    if (!password && !confirm) {
      return true;
    }
    return password.length > 0 && password === confirm;
  });

  readonly passwordError = computed(() => {
    if (this.isEdit() || !this.showErrors()) {
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

  readonly initialUserPasswordsMatch = computed(() => {
    const password = this.initialUserPassword();
    const confirm = this.initialUserPasswordConfirm();
    if (!password && !confirm) {
      return true;
    }
    return password.length > 0 && password === confirm;
  });

  readonly initialUserPasswordError = computed(() => {
    if (this.section() !== 'dealers' || this.isEdit() || !this.showErrors()) {
      return null;
    }
    if (!this.initialUserPassword().trim()) {
      return 'Şifre zorunludur.';
    }
    if (this.initialUserPassword().trim().length < 6) {
      return 'Şifre en az 6 karakter olmalıdır.';
    }
    if (!this.initialUserPasswordConfirm().trim()) {
      return 'Şifre tekrarını giriniz.';
    }
    if (!this.initialUserPasswordsMatch()) {
      return 'Şifreler eşleşmiyor.';
    }
    return null;
  });

  readonly initialUserError = computed(() => {
    if (this.section() !== 'dealers' || this.isEdit() || !this.showErrors()) {
      return null;
    }
    if (!this.initialUserName().trim()) {
      return 'Kullanıcı adı zorunludur.';
    }
    if (!this.initialUserEmail().trim()) {
      return 'E-posta zorunludur.';
    }
    return this.initialUserPasswordError();
  });

  constructor() {
    effect(() => {
      const target = this.editTarget();
      const section = this.section();
      const preset = this.createPreset();
      this.showErrors.set(false);
      this.password.set('');
      this.passwordConfirm.set('');
      this.initialUserName.set('');
      this.initialUserEmail.set('');
      this.initialUserPassword.set('');
      this.initialUserPasswordConfirm.set('');

      if (!target) {
        this.name.set('');
        this.email.set('');
        this.role.set('');
        this.dealerId.set(null);
        this.code.set('');
        this.city.set('');
        this.phone.set('');
        this.contactInfo.set('');
        this.description.set('');
        this.brandIds.set([]);
        this.active.set(true);
        this.badgeLabel.set('');
        this.badgeColor.set('#374151');

        if (preset && section === 'users') {
          this.role.set(preset.role);
          this.dealerId.set(preset.dealerId);
        }
        return;
      }

      if (target.kind === 'user') {
        this.name.set(target.item.name);
        this.email.set(target.item.email);
        this.role.set(target.item.role);
        this.dealerId.set(target.item.dealerId);
        this.active.set(target.item.active);
        return;
      }

      this.name.set(target.item.name);
      this.active.set(target.item.active);
      this.code.set(target.item.code ?? '');
      this.city.set(target.item.city ?? '');
      this.phone.set(target.item.phone ?? '');
      this.contactInfo.set(target.item.contactInfo ?? '');
      this.description.set(target.item.description ?? (section === 'categories' ? target.item.detail : ''));
      this.brandIds.set([...(target.item.brandIds ?? [])]);
      this.badgeLabel.set(target.item.badgeLabel ?? '');
      this.badgeColor.set(target.item.badgeColor ?? '#374151');
    });
  }

  readonly badgePreviewLabel = computed(() => {
    const custom = this.badgeLabel().trim();
    return custom || this.name().trim() || 'Önizleme';
  });

  setBadgeColor(color: string): void {
    this.badgeColor.set(color);
  }

  title(): string {
    const edit = this.isEdit();
    const labels: Record<DefinitionSection, [string, string]> = {
      users: ['Yeni Kullanıcı Ekle', 'Kullanıcıyı Düzenle'],
      dealers: ['Yeni Bayi Ekle', 'Bayiyi Düzenle'],
      brands: ['Yeni Marka Ekle', 'Markayı Düzenle'],
      categories: ['Yeni Kategori Ekle', 'Kategoriyi Düzenle'],
    };
    return labels[this.section()][edit ? 1 : 0];
  }

  simpleNameLabel(): string {
    return `${DEFINITION_LABELS[this.section()].replace(/ler$|lar$/, '')} Adı`;
  }

  setActive(value: boolean): void {
    this.active.set(value);
  }

  toggleBrand(id: number, checked: boolean): void {
    this.brandIds.update((list) =>
      checked ? [...new Set([...list, id])] : list.filter((x) => x !== id)
    );
  }

  isBrandSelected(id: number): boolean {
    return this.brandIds().includes(id);
  }

  onDealerChange(raw: string): void {
    this.dealerId.set(raw ? Number(raw) : null);
  }

  save(): void {
    this.showErrors.set(true);
    const section = this.section();
    const edit = this.isEdit();

    if (section === 'users') {
      if (!this.name().trim() || !this.role().trim()) {
        return;
      }
      if (!edit && (!this.email().trim() || !!this.passwordError())) {
        return;
      }
      if (this.role() === 'DealerUser' && !this.dealerId()) {
        return;
      }
    } else if (section === 'dealers') {
      if (!this.name().trim() || !this.code().trim() || !this.city().trim() || !this.phone().trim()) {
        return;
      }
      if (!edit) {
        if (this.brandIds().length === 0) {
          return;
        }
        if (!!this.initialUserError()) {
          return;
        }
      }
    } else if (section === 'brands') {
      if (!this.name().trim() || !this.code().trim()) {
        return;
      }
    } else if (!this.name().trim()) {
      return;
    }

    const target = this.editTarget();
    const initialUser =
      section === 'dealers' && !edit
        ? {
            name: this.initialUserName().trim(),
            email: this.initialUserEmail().trim(),
            password: this.initialUserPassword(),
          }
        : null;

    this.saved.emit({
      section,
      id: target?.item.id ?? null,
      name: this.name().trim(),
      email: this.email().trim(),
      password: this.password(),
      role: this.role(),
      dealerId: this.role() === 'DealerUser' ? this.dealerId() : null,
      code: this.code().trim(),
      city: this.city().trim(),
      phone: this.phone().trim(),
      contactInfo: this.contactInfo().trim(),
      description: this.description().trim(),
      brandIds: [...this.brandIds()],
      active: this.active(),
      badgeLabel: this.badgeLabel().trim(),
      badgeColor: this.badgeColor().trim() || '#374151',
      initialUser,
    });
  }
}
