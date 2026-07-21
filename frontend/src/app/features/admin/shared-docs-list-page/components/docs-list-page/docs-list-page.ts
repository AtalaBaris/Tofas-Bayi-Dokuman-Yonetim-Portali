/** Paylaşılan doküman listesi sayfası (admin, gerçek Materials API). */
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MaterialsService } from '../../../../../core/services/materials.service';
import { DocsListHeader } from '../docs-list-header/docs-list-header';
import { DocsListFilters } from '../docs-list-filters/docs-list-filters';
import { DocsListTabs } from '../docs-list-tabs/docs-list-tabs';
import { DocsListRow } from '../docs-list-row/docs-list-row';
import { DocsDetailDrawer } from '../docs-detail-drawer/docs-detail-drawer';
import { docsListAnimations } from '../../animations/docs-list.animations';
import {
  toAdminDocumentListItem,
  type DocumentListItem,
  type DocumentStatusTab,
  type DocumentViewerRow,
} from '../../models/document-list.model';

/** Her scroll yüklemesinde DOM'a eklenen kart sayısı. */
const PAGE_SIZE = 20;

@Component({
  selector: 'app-docs-list-page',
  imports: [DocsListHeader, DocsListFilters, DocsListTabs, DocsListRow, DocsDetailDrawer],
  templateUrl: './docs-list-page.html',
  styleUrl: '../../styles/docs-list-page.scss',
  animations: docsListAnimations,
})
export class DocsListPage {
  private readonly materialsService = inject(MaterialsService);

  readonly documents = signal<DocumentListItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly category = signal('');
  readonly brands = signal<string[]>([]);
  readonly statusTab = signal<DocumentStatusTab>('all');
  readonly selected = signal<DocumentListItem | null>(null);
  readonly viewers: DocumentViewerRow[] = [];
  readonly visibleCount = signal(PAGE_SIZE);
  readonly loadingMore = signal(false);

  readonly categoryOptions = computed(() => {
    const set = new Set<string>();
    for (const doc of this.documents()) {
      set.add(doc.category);
    }
    return [...set].sort();
  });

  readonly brandOptions = computed(() => {
    const set = new Set<string>();
    for (const doc of this.documents()) {
      for (const brand of doc.brands) {
        set.add(brand.label);
      }
    }
    return [...set].sort();
  });

  readonly filteredDocs = computed(() => {
    const q = this.search().trim().toLowerCase();
    const category = this.category();
    const brands = this.brands().map((b) => b.toLowerCase());
    const status = this.statusTab();

    return this.documents().filter((doc) => {
      if (status !== 'all' && doc.status !== status) {
        return false;
      }
      if (category && doc.category !== category) {
        return false;
      }
      if (brands.length > 0) {
        const matchesBrand = doc.brands.some(
          (b) => b.tone === 'all' || brands.includes(b.label.toLowerCase())
        );
        if (!matchesBrand) {
          return false;
        }
      }
      if (q && !doc.title.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  });

  readonly visibleDocs = computed(() =>
    this.filteredDocs().slice(0, this.visibleCount())
  );

  readonly hasMore = computed(
    () => this.visibleCount() < this.filteredDocs().length
  );

  readonly totalFiltered = computed(() => this.filteredDocs().length);

  constructor() {
    this.materialsService.list().subscribe({
      next: (materials) => {
        this.documents.set(materials.map(toAdminDocumentListItem));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Dokümanlar yüklenemedi.');
        this.loading.set(false);
      },
    });

    // Filtre / sekme değişince sayfalama başa döner
    effect(() => {
      this.search();
      this.category();
      this.brands();
      this.statusTab();
      this.visibleCount.set(PAGE_SIZE);
    });
  }

  onListScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 160;
    if (nearBottom) {
      this.loadMore();
    }
  }

  loadMore(): void {
    if (!this.hasMore() || this.loadingMore()) {
      return;
    }

    this.loadingMore.set(true);
    // Kısa gecikme: gerçek API çağrısını simüle eder, scroll spam'ini de keser
    window.setTimeout(() => {
      this.visibleCount.update((count) =>
        Math.min(count + PAGE_SIZE, this.filteredDocs().length)
      );
      this.loadingMore.set(false);
    }, 120);
  }

  selectDoc(doc: DocumentListItem): void {
    this.selected.set(doc);
  }

  closeDrawer(): void {
    this.selected.set(null);
  }

  archiveDoc(doc: DocumentListItem): void {
    this.materialsService.archive(doc.id).subscribe({
      next: () => {
        this.documents.update((list) =>
          list.map((item) => (item.id === doc.id ? { ...item, status: 'archived' as const } : item))
        );
        if (this.selected()?.id === doc.id) {
          this.selected.set(null);
        }
      },
      error: (err) => this.error.set(err?.message ?? 'Doküman arşivlenemedi.'),
    });
  }
}
