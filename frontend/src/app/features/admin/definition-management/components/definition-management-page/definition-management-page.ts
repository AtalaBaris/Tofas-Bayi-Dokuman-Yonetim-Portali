import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ConfirmDialog } from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import { DefinitionTable, type DefinitionRowTarget } from '../definition-table/definition-table';
import {
  DefinitionDrawer,
  type DefinitionDrawerSavePayload,
} from '../definition-drawer/definition-drawer';
import { definitionManagementAnimations } from '../../animations/definition-management.animations';
import {
  DEFINITION_LABELS,
  MOCK_USERS,
  SIMPLE_DEFINITIONS,
  isDefinitionSection,
  type DefinitionSection,
  type DefinitionUser,
  type SimpleDefinitionItem,
} from '../../models/definition-management.model';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Sistem Yöneticisi',
  content: 'İçerik Yöneticisi',
  dealer: 'Bayi Yöneticisi',
  sales: 'Satış Temsilcisi',
};

const DEALER_LABELS: Record<string, string> = {
  '1': 'Marmara Otomotiv',
  '2': 'Ege Motorlu Araçlar',
  '3': 'İç Anadolu Distribütör',
};

@Component({
  selector: 'app-definition-management-page',
  imports: [DefinitionTable, DefinitionDrawer, ConfirmDialog],
  templateUrl: './definition-management-page.html',
  styleUrl: '../../styles/definition-management-page.scss',
  animations: definitionManagementAnimations,
})
export class DefinitionManagementPage {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly search = signal('');
  readonly drawerOpen = signal(false);
  readonly confirmOpen = signal(false);
  readonly pendingDelete = signal<DefinitionRowTarget | null>(null);

  readonly allUsers = signal<DefinitionUser[]>(MOCK_USERS.map((user) => ({ ...user })));
  readonly allDealers = signal<SimpleDefinitionItem[]>(
    SIMPLE_DEFINITIONS.dealers.map((item) => ({ ...item }))
  );
  readonly allBrands = signal<SimpleDefinitionItem[]>(
    SIMPLE_DEFINITIONS.brands.map((item) => ({ ...item }))
  );
  readonly allCategories = signal<SimpleDefinitionItem[]>(
    SIMPLE_DEFINITIONS.categories.map((item) => ({ ...item }))
  );

  readonly section = computed<DefinitionSection>(() => {
    const value = this.params().get('section');
    return isDefinitionSection(value) ? value : 'users';
  });

  readonly title = computed(() => DEFINITION_LABELS[this.section()]);
  readonly searchPlaceholder = computed(() => `${this.title()} içinde ara...`);

  readonly confirmTitle = computed(() => {
    const pending = this.pendingDelete();
    if (!pending) {
      return 'Kaydı sil';
    }
    return `"${pending.item.name}" silinsin mi?`;
  });

  readonly confirmMessage = computed(() => {
    const section = this.section();
    const labels: Record<DefinitionSection, string> = {
      users: 'Bu kullanıcı kalıcı olarak silinecek.',
      dealers: 'Bu bayi kaydı kalıcı olarak silinecek.',
      brands: 'Bu marka kaydı kalıcı olarak silinecek.',
      categories: 'Bu kategori kaydı kalıcı olarak silinecek.',
    };
    return labels[section];
  });

  readonly users = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('tr-TR');
    const list = this.allUsers();
    if (!query) {
      return list;
    }
    return list.filter((user) =>
      [user.name, user.email, user.role, user.dealer].some((value) =>
        value.toLocaleLowerCase('tr-TR').includes(query)
      )
    );
  });

  readonly items = computed(() => {
    const section = this.section();
    if (section === 'users') {
      return [];
    }
    const query = this.search().trim().toLocaleLowerCase('tr-TR');
    const list = this.listForSection(section)();
    return query
      ? list.filter((item) =>
          `${item.name} ${item.detail}`.toLocaleLowerCase('tr-TR').includes(query)
        )
      : list;
  });

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  saveDefinition(payload: DefinitionDrawerSavePayload): void {
    if (payload.section === 'users') {
      const nextId = Math.max(0, ...this.allUsers().map((user) => user.id)) + 1;
      this.allUsers.update((list) => [
        {
          id: nextId,
          name: payload.name,
          email: payload.email,
          role: ROLE_LABELS[payload.role] ?? 'Kullanıcı',
          dealer: payload.dealer ? DEALER_LABELS[payload.dealer] ?? '—' : '—',
          active: payload.active,
        },
        ...list,
      ]);
    } else {
      const store = this.listForSection(payload.section);
      const nextId = Math.max(0, ...store().map((item) => item.id)) + 1;
      store.update((list) => [
        {
          id: nextId,
          name: payload.name,
          detail: payload.detail || 'Yeni kayıt',
          active: payload.active,
        },
        ...list,
      ]);
    }

    this.closeDrawer();
  }

  onEdit(_target: DefinitionRowTarget): void {
    this.openDrawer();
  }

  onToggleActive(target: DefinitionRowTarget): void {
    if (target.kind === 'user') {
      this.allUsers.update((list) =>
        list.map((user) =>
          user.id === target.item.id ? { ...user, active: !user.active } : user
        )
      );
      return;
    }

    const section = this.section();
    if (section === 'users') {
      return;
    }

    this.listForSection(section).update((list) =>
      list.map((item) =>
        item.id === target.item.id ? { ...item, active: !item.active } : item
      )
    );
  }

  onDeleteRequest(target: DefinitionRowTarget): void {
    this.pendingDelete.set(target);
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    this.confirmOpen.set(false);
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const pending = this.pendingDelete();
    if (!pending) {
      return;
    }

    if (pending.kind === 'user') {
      this.allUsers.update((list) => list.filter((user) => user.id !== pending.item.id));
    } else {
      const section = this.section();
      if (section !== 'users') {
        this.listForSection(section).update((list) =>
          list.filter((item) => item.id !== pending.item.id)
        );
      }
    }

    this.closeConfirm();
  }

  private listForSection(section: Exclude<DefinitionSection, 'users'>) {
    switch (section) {
      case 'dealers':
        return this.allDealers;
      case 'brands':
        return this.allBrands;
      case 'categories':
        return this.allCategories;
    }
  }
}
