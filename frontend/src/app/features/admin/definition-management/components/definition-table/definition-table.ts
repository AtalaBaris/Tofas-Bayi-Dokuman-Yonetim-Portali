import { Component, computed, HostListener, input, output, signal } from '@angular/core';
import {
  initials,
  type DefinitionSection,
  type DefinitionUser,
  type SimpleDefinitionItem,
} from '../../models/definition-management.model';

export type DefinitionRowTarget =
  | { kind: 'user'; item: DefinitionUser }
  | { kind: 'item'; item: SimpleDefinitionItem };

@Component({
  selector: 'app-definition-table',
  templateUrl: './definition-table.html',
  styleUrl: '../../styles/definition-table.scss',
})
export class DefinitionTable {
  readonly section = input.required<DefinitionSection>();
  readonly users = input<DefinitionUser[]>([]);
  readonly items = input<SimpleDefinitionItem[]>([]);
  readonly search = input('');
  readonly searchPlaceholder = input('Ara...');
  readonly addClick = output<void>();
  readonly searchChange = output<string>();
  readonly editClick = output<DefinitionRowTarget>();
  readonly deleteClick = output<DefinitionRowTarget>();
  readonly toggleActiveClick = output<DefinitionRowTarget>();

  readonly initials = initials;
  readonly sortKey = signal<'name' | 'status' | null>(null);
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly openMenuKey = signal<string | null>(null);
  readonly menuOpensUp = signal(false);

  readonly sortedUsers = computed(() => {
    const key = this.sortKey();
    if (!key) {
      return this.users();
    }

    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    return [...this.users()].sort((left, right) => {
      if (key === 'name') {
        return left.name.localeCompare(right.name, 'tr-TR') * direction;
      }
      return (Number(left.active) - Number(right.active)) * direction;
    });
  });

  readonly sortedItems = computed(() => {
    const key = this.sortKey();
    if (!key) {
      return this.items();
    }

    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    return [...this.items()].sort((left, right) => {
      if (key === 'name') {
        return left.name.localeCompare(right.name, 'tr-TR') * direction;
      }
      return (Number(left.active) - Number(right.active)) * direction;
    });
  });

  addButtonLabel(): string {
    const labels: Record<DefinitionSection, string> = {
      users: 'Yeni Kullanıcı Ekle',
      dealers: 'Yeni Bayi Ekle',
      brands: 'Yeni Marka Ekle',
      categories: 'Yeni Kategori Ekle',
    };
    return labels[this.section()];
  }

  countLabel(): string {
    const count = this.section() === 'users' ? this.users().length : this.items().length;
    return `Toplam ${count} kayıt gösteriliyor`;
  }

  toggleSort(key: 'name' | 'status'): void {
    if (this.sortKey() === key) {
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }
    this.sortKey.set(key);
    this.sortDirection.set('asc');
  }

  sortIcon(key: 'name' | 'status'): string {
    if (this.sortKey() !== key) {
      return 'unfold_more';
    }
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  menuKey(kind: 'user' | 'item', id: number): string {
    return `${kind}-${id}`;
  }

  toggleMenu(kind: 'user' | 'item', id: number, event: Event): void {
    event.stopPropagation();
    const key = this.menuKey(kind, id);
    if (this.openMenuKey() === key) {
      this.openMenuKey.set(null);
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const menuHeight = 160;
    const scroll = button.closest('.definition-table__scroll');
    const scrollBottom = scroll?.getBoundingClientRect().bottom ?? window.innerHeight;
    const spaceBelow = scrollBottom - rect.bottom;
    this.menuOpensUp.set(spaceBelow < menuHeight);
    this.openMenuKey.set(key);
  }

  isMenuOpen(kind: 'user' | 'item', id: number): boolean {
    return this.openMenuKey() === this.menuKey(kind, id);
  }

  onEdit(target: DefinitionRowTarget, event: Event): void {
    event.stopPropagation();
    this.openMenuKey.set(null);
    this.editClick.emit(target);
  }

  onDelete(target: DefinitionRowTarget, event: Event): void {
    event.stopPropagation();
    this.openMenuKey.set(null);
    this.deleteClick.emit(target);
  }

  onToggleActive(target: DefinitionRowTarget, event: Event): void {
    event.stopPropagation();
    this.openMenuKey.set(null);
    this.toggleActiveClick.emit(target);
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.openMenuKey.set(null);
  }
}
