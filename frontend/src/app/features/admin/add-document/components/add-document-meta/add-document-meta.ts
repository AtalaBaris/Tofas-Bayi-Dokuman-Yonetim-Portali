/** Kategori, marka, tarihler ve durum. */
import { Component, computed, HostListener, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BRAND_OPTIONS,
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  type MaterialFormStatus,
} from '../../models/add-document.model';
import { addDocumentAnimations } from '../../animations/add-document.animations';

@Component({
  selector: 'app-add-document-meta',
  imports: [FormsModule],
  templateUrl: './add-document-meta.html',
  styleUrl: '../../styles/add-document-meta.scss',
  animations: addDocumentAnimations,
})
export class AddDocumentMeta {
  readonly category = input('');
  readonly brands = input<string[]>([]);
  readonly publishedAt = input('');
  readonly expiresAt = input('');
  readonly status = input<MaterialFormStatus>('active');

  readonly categoryChange = output<string>();
  readonly brandsChange = output<string[]>();
  readonly publishedAtChange = output<string>();
  readonly expiresAtChange = output<string>();
  readonly statusChange = output<MaterialFormStatus>();

  readonly brandMenuOpen = signal(false);
  readonly categories = CATEGORY_OPTIONS;
  readonly statuses = STATUS_OPTIONS;
  readonly allBrands = BRAND_OPTIONS;

  readonly availableBrands = computed(() => {
    const selected = this.brands();
    return this.allBrands.filter((b) => !selected.includes(b.label));
  });

  removeBrand(brand: string): void {
    this.brandsChange.emit(this.brands().filter((b) => b !== brand));
  }

  addBrand(brand: string): void {
    if (!this.brands().includes(brand)) {
      this.brandsChange.emit([...this.brands(), brand]);
    }
    this.brandMenuOpen.set(false);
  }

  toggleBrandMenu(): void {
    if (this.availableBrands().length === 0) {
      return;
    }
    this.brandMenuOpen.update((open) => !open);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.add-meta__brand-menu-wrap')) {
      this.brandMenuOpen.set(false);
    }
  }
}
