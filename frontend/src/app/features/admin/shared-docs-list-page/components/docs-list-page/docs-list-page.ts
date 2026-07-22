/** Paylaşılan doküman listesi sayfası (admin) — GET /api/materials. */
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { DocsListHeader } from '../docs-list-header/docs-list-header';
import { DocsListFilters } from '../docs-list-filters/docs-list-filters';
import { DocsListTabs } from '../docs-list-tabs/docs-list-tabs';
import { DocsListRow } from '../docs-list-row/docs-list-row';
import { DocsDetailDrawer } from '../docs-detail-drawer/docs-detail-drawer';
import { docsListAnimations } from '../../animations/docs-list.animations';
import {
  materialToDocumentListItem,
  matchesSearchQuery,
  type DocumentListItem,
  type DocumentStatusTab,
  type DocumentViewerRow,
} from '../../models/document-list.model';
import { MaterialsService } from '../../../../../core/services/materials.service';
import { saveBlobAsFile } from '../../../../../shared/utils/file-download.util';

/** Her scroll yüklemesinde DOM'a eklenen kart sayısı. */
const PAGE_SIZE = 20;

@Component({
  selector: 'app-docs-list-page',
  imports: [
    DocsListHeader,
    DocsListFilters,
    DocsListTabs,
    DocsListRow,
    DocsDetailDrawer,
  ],
  templateUrl: './docs-list-page.html',
  styleUrl: '../../styles/docs-list-page.scss',
  animations: docsListAnimations,
})
export class DocsListPage implements OnInit {
  private readonly materialsApi = inject(MaterialsService);

  readonly documents = signal<DocumentListItem[]>([]);
  readonly search = signal('');
  readonly category = signal('');
  readonly brands = signal<string[]>([]);
  /** ISO tarih (YYYY-MM-DD) — yayın tarihi aralığı filtresi. */
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly statusTab = signal<DocumentStatusTab>('all');
  readonly selected = signal<DocumentListItem | null>(null);
  readonly viewers = signal<DocumentViewerRow[]>([]);
  readonly visibleCount = signal(PAGE_SIZE);
  readonly loadingMore = signal(false);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly categoryOptions = computed(() => {
    const set = new Set(this.documents().map((d) => d.category).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
  });

  readonly brandOptions = computed(() => {
    const set = new Set<string>();
    for (const doc of this.documents()) {
      for (const brand of doc.brands) {
        set.add(brand.label);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
  });

  readonly filteredDocs = computed(() => {
    const q = this.search();
    const category = this.category();
    const brands = this.brands().map((b) => b.toLowerCase());
    const status = this.statusTab();
    const dateFrom = this.dateFrom();
    const dateTo = this.dateTo();

    return this.documents().filter((doc) => {
      if (status !== 'all' && doc.status !== status) {
        return false;
      }
      if (category && doc.category !== category) {
        return false;
      }
      if (brands.length > 0) {
        const matchesBrand = doc.brands.some((b) => brands.includes(b.label.toLowerCase()));
        if (!matchesBrand) {
          return false;
        }
      }
      if (!matchesSearchQuery(doc, q)) {
        return false;
      }
      if (dateFrom && doc.publishedAtIso && doc.publishedAtIso < dateFrom) {
        return false;
      }
      if (dateTo && doc.publishedAtIso && doc.publishedAtIso > dateTo) {
        return false;
      }
      return true;
    });
  });

  readonly visibleDocs = computed(() => this.filteredDocs().slice(0, this.visibleCount()));

  readonly hasMore = computed(() => this.visibleCount() < this.filteredDocs().length);

  readonly totalFiltered = computed(() => this.filteredDocs().length);

  constructor() {
    effect(() => {
      this.search();
      this.category();
      this.brands();
      this.statusTab();
      this.dateFrom();
      this.dateTo();
      this.visibleCount.set(PAGE_SIZE);
    });
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.materialsApi.list().subscribe({
      next: (materials) => {
        this.documents.set(materials.map(materialToDocumentListItem));
        this.loading.set(false);
      },
      error: (err: { message?: string }) => {
        this.loadError.set(err?.message ?? 'Doküman listesi yüklenemedi.');
        this.loading.set(false);
      },
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
    window.setTimeout(() => {
      this.visibleCount.update((count) => Math.min(count + PAGE_SIZE, this.filteredDocs().length));
      this.loadingMore.set(false);
    }, 80);
  }

  selectDoc(doc: DocumentListItem): void {
    this.selected.set(doc);
  }

  closeDrawer(): void {
    this.selected.set(null);
  }

  downloadFile(event: { materialId: number; fileId: number; fileName: string }): void {
    this.materialsApi.downloadFile(event.materialId, event.fileId).subscribe({
      next: (blob) => saveBlobAsFile(blob, event.fileName),
      error: (err: { message?: string }) => {
        this.loadError.set(err?.message ?? 'Dosya indirilemedi.');
      },
    });
  }

  archiveDoc(doc: DocumentListItem): void {
    this.materialsApi.archive(doc.id).subscribe({
      next: () => {
        this.documents.update((list) =>
          list.map((item) =>
            item.id === doc.id ? { ...item, status: 'archived' as const } : item
          )
        );
        if (this.selected()?.id === doc.id) {
          this.selected.set(null);
        }
      },
      error: (err: { message?: string }) => {
        this.loadError.set(err?.message ?? 'Arşivleme başarısız.');
      },
    });
  }
}
