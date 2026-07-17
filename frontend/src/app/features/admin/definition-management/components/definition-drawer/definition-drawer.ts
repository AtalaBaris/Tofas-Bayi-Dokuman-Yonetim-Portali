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
  description: string;
  brandIds: number[];
  active: boolean;
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
  readonly description = signal('');
  readonly brandIds = signal<number[]>([]);
  readonly active = signal(true);
  readonly showErrors = signal(false);

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

  constructor() {
    effect(() => {
      const target = this.editTarget();
      const section = this.section();
      this.showErrors.set(false);
      this.password.set('');
      this.passwordConfirm.set('');

      if (!target) {
        this.name.set('');
        this.email.set('');
        this.role.set('');
        this.dealerId.set(null);
        this.code.set('');
        this.description.set('');
        this.brandIds.set([]);
        this.active.set(true);
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
      this.description.set(target.item.description ?? (section === 'categories' ? target.item.detail : ''));
      this.brandIds.set([...(target.item.brandIds ?? [])]);
    });
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
      if (!this.name().trim() || !this.code().trim()) {
        return;
      }
    } else if (section === 'brands') {
      if (!this.name().trim() || !this.code().trim()) {
        return;
      }
    } else if (!this.name().trim()) {
      return;
    }

    const target = this.editTarget();
    this.saved.emit({
      section,
      id: target?.item.id ?? null,
      name: this.name().trim(),
      email: this.email().trim(),
      password: this.password(),
      role: this.role(),
      dealerId: this.role() === 'DealerUser' ? this.dealerId() : null,
      code: this.code().trim(),
      description: this.description().trim(),
      brandIds: [...this.brandIds()],
      active: this.active(),
    });
  }
}
