/** Bayi doküman listesi — bento kart grid, filtreler ve erişim durumu (gerçek Materials API). */
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialsService } from '../../../../../core/services/materials.service';
import { saveBlobAsFile } from '../../../../../shared/utils/file-download.util';
import {
  accessStatusMeta,
  cardVisualIcon,
  fileKindIcon,
  fileKindLabel,
  isUrgentDocument,
  toBayiDocumentCard,
  viewActionLabel,
  type BayiDocAccessStatus,
  type BayiDocumentCard,
} from '../../../home/models/bayi-home.model';

const PAGE_SIZE = 6;

@Component({
  selector: 'app-bayi-documents-page',
  imports: [FormsModule],
  templateUrl: './bayi-documents-page.html',
  styleUrls: ['../../styles/bayi-documents-page.scss', '../../styles/bayi-documents-empty.scss'],
})
export class BayiDocumentsPage {
  private readonly router = inject(Router);
  private readonly materialsService = inject(MaterialsService);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly loading = signal(true);
  readonly error = signal('');
  readonly allDocs = signal<BayiDocumentCard[]>([]);

  readonly search = signal('');
  readonly category = signal('');
  readonly brand = signal('');
  readonly accessFilter = signal<'' | BayiDocAccessStatus>('');
  readonly visibleCount = signal(PAGE_SIZE);

  readonly categories = computed(() => {
    const set = new Set<string>();
    for (const doc of this.allDocs()) {
      set.add(doc.category);
    }
    return [...set].sort();
  });

  readonly brands = computed(() => {
    const set = new Map<string, string>();
    for (const doc of this.allDocs()) {
      for (const brand of doc.brands) {
        set.set(brand.badgeLabel || brand.name, brand.badgeLabel || brand.name);
      }
    }
    return [...set.values()].sort();
  });

  readonly statusCounts = computed(() => {
    const counts = { unread: 0, viewed: 0, downloaded: 0 };
    for (const doc of this.allDocs()) {
      counts[doc.accessStatus] += 1;
    }
    return counts;
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.category();
    const brand = this.brand();
    const access = this.accessFilter();

    return this.allDocs().filter((d) => {
      if (cat && d.category !== cat) {
        return false;
      }
      if (brand && !d.brands.some((b) => (b.badgeLabel || b.name) === brand)) {
        return false;
      }
      if (access && d.accessStatus !== access) {
        return false;
      }
      if (q) {
        const haystack = [
          d.title,
          d.category,
          ...d.brands.map((b) => `${b.badgeLabel} ${b.name}`),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });
  });

  readonly visibleDocs = computed(() => this.filtered().slice(0, this.visibleCount()));

  readonly canLoadMore = computed(() => this.visibleCount() < this.filtered().length);

  readonly accessStatusMeta = accessStatusMeta;
  readonly fileKindLabel = fileKindLabel;
  readonly cardVisualIcon = cardVisualIcon;
  readonly isUrgentDocument = isUrgentDocument;
  readonly viewActionLabel = viewActionLabel;

  constructor() {
    this.materialsService.list().subscribe({
      next: (materials) => {
        this.allDocs.set(materials.map(toBayiDocumentCard));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Dokümanlar yüklenemedi.');
        this.loading.set(false);
      },
    });
  }

  fileKindIcon(doc: BayiDocumentCard): string {
    return fileKindIcon(doc.fileKind);
  }

  viewActionIcon(doc: BayiDocumentCard): string {
    return doc.fileKind === 'video' ? 'play_arrow' : 'visibility';
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.resetPagination();
  }

  onCategory(value: string): void {
    this.category.set(value);
    this.resetPagination();
  }

  onBrand(value: string): void {
    this.brand.set(value);
    this.resetPagination();
  }

  onAccessFilter(value: string): void {
    this.accessFilter.set(value as '' | BayiDocAccessStatus);
    this.resetPagination();
  }

  setAccessFilter(value: '' | BayiDocAccessStatus): void {
    this.accessFilter.set(value);
    this.resetPagination();
  }

  clearFilters(): void {
    this.search.set('');
    this.category.set('');
    this.brand.set('');
    this.accessFilter.set('');
    this.resetPagination();
  }

  focusSearch(): void {
    this.searchInput()?.nativeElement.focus();
  }

  loadMore(): void {
    this.visibleCount.update((n) => n + PAGE_SIZE);
  }

  openDetail(doc: BayiDocumentCard): void {
    void this.router.navigate(['/bayi/documents', doc.id], { queryParams: { view: 'true' } });
  }

  onView(doc: BayiDocumentCard, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/bayi/documents', doc.id], { queryParams: { view: 'true' } });
  }

  onDownload(doc: BayiDocumentCard, event: Event): void {
    event.stopPropagation();
    this.materialsService.download(doc.id).subscribe({
      next: (blob) => {
        saveBlobAsFile(blob, doc.fileName ?? doc.title);
        this.allDocs.update((docs) =>
          docs.map((d) => (d.id === doc.id ? { ...d, accessStatus: 'downloaded' } : d))
        );
      },
      error: (err) => this.error.set(err?.message ?? 'Dosya indirilemedi.'),
    });
  }

  private resetPagination(): void {
    this.visibleCount.set(PAGE_SIZE);
  }
}
