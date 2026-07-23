/** Arama + kategori + çoklu marka (checkbox) filtreleri. */
import { Component, computed, HostListener, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-docs-list-filters',
  imports: [FormsModule],
  templateUrl: './docs-list-filters.html',
  styleUrl: '../../styles/docs-list-filters.scss',
})
export class DocsListFilters {
  readonly search = input('');
  readonly category = input('');
  readonly brands = input<string[]>([]);
  readonly categoryOptions = input<string[]>([]);
  readonly brandOptions = input<string[]>([]);
  /** ISO tarih (YYYY-MM-DD) — yayın tarihi aralığının başlangıcı. */
  readonly dateFrom = input('');
  /** ISO tarih (YYYY-MM-DD) — yayın tarihi aralığının bitişi. */
  readonly dateTo = input('');

  readonly searchChange = output<string>();
  readonly categoryChange = output<string>();
  readonly brandsChange = output<string[]>();
  readonly dateFromChange = output<string>();
  readonly dateToChange = output<string>();

  readonly brandMenuOpen = signal(false);

  readonly brandTriggerLabel = computed(() => {
    const selected = this.brands();
    if (selected.length === 0) {
      return 'Marka';
    }
    if (selected.length === 1) {
      return selected[0];
    }
    return `${selected.length} marka`;
  });

  toggleBrandMenu(): void {
    this.brandMenuOpen.update((open) => !open);
  }

  isBrandSelected(brand: string): boolean {
    return this.brands().includes(brand);
  }

  toggleBrand(brand: string, checked: boolean): void {
    const current = this.brands();
    const next = checked ? [...current, brand] : current.filter((b) => b !== brand);
    this.brandsChange.emit(next);
  }

  clearBrands(): void {
    this.brandsChange.emit([]);
  }

  clearDateRange(): void {
    this.dateFromChange.emit('');
    this.dateToChange.emit('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.docs-filters__brand')) {
      this.brandMenuOpen.set(false);
    }
  }
}
