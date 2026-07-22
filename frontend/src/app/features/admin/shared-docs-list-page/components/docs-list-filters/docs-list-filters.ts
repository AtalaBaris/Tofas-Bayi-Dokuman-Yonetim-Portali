/** Arama + kategori + çoklu marka (checkbox) filtreleri. */
import { Component, computed, HostListener, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export const BRAND_FILTER_OPTIONS = [
  'Fiat',
  'Jeep',
  'Peugeot',
  'Opel',
  'Citroen',
] as const;

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

  readonly searchChange = output<string>();
  readonly categoryChange = output<string>();
  readonly brandsChange = output<string[]>();

  readonly brandMenuOpen = signal(false);
  readonly brandOptions = BRAND_FILTER_OPTIONS;

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
    const next = checked
      ? [...current, brand]
      : current.filter((b) => b !== brand);
    this.brandsChange.emit(next);
  }

  clearBrands(): void {
    this.brandsChange.emit([]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.docs-filters__brand')) {
      this.brandMenuOpen.set(false);
    }
  }
}
