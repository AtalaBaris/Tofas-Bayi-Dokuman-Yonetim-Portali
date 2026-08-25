/** Kategori, marka, tarihler ve durum. */
import { Component, computed, HostListener, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  RECURRENCE_OPTIONS,
  STATUS_OPTIONS,
  WEEKDAY_OPTIONS,
  type BrandOption,
  type CategoryOption,
  type MaterialFormStatus,
  type RecurrenceFormKind,
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
  readonly brandIds = input<number[]>([]);
  readonly publishedAt = input('');
  readonly scheduledAt = input('');
  readonly expiresAt = input('');
  readonly status = input<MaterialFormStatus>('active');
  readonly recurrenceKind = input<RecurrenceFormKind>('None');
  readonly recurrenceDayOfWeek = input(1);
  readonly recurrenceDayOfMonth = input(1);
  readonly categories = input<CategoryOption[]>([]);
  readonly allBrands = input<BrandOption[]>([]);
  readonly showErrors = input(false);

  readonly categoryChange = output<string>();
  readonly brandIdsChange = output<number[]>();
  readonly publishedAtChange = output<string>();
  readonly scheduledAtChange = output<string>();
  readonly expiresAtChange = output<string>();
  readonly statusChange = output<MaterialFormStatus>();
  readonly recurrenceKindChange = output<RecurrenceFormKind>();
  readonly recurrenceDayOfWeekChange = output<number>();
  readonly recurrenceDayOfMonthChange = output<number>();

  readonly brandMenuOpen = signal(false);
  readonly statuses = STATUS_OPTIONS;
  readonly recurrenceOptions = RECURRENCE_OPTIONS;
  readonly weekdayOptions = WEEKDAY_OPTIONS;

  readonly selectedBrands = computed(() => {
    const ids = new Set(this.brandIds());
    return this.allBrands().filter((b) => ids.has(b.id));
  });

  readonly availableBrands = computed(() => {
    const ids = new Set(this.brandIds());
    return this.allBrands().filter((b) => !ids.has(b.id));
  });

  readonly isScheduled = computed(() => this.status() === 'scheduled');

  removeBrand(brandId: number): void {
    this.brandIdsChange.emit(this.brandIds().filter((id) => id !== brandId));
  }

  addBrand(brandId: number): void {
    if (!this.brandIds().includes(brandId)) {
      this.brandIdsChange.emit([...this.brandIds(), brandId]);
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
