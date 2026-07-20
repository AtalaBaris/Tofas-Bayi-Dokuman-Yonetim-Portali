/** Bayi doküman listesi — bento kart grid, filtreler ve erişim durumu. */
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  accessStatusMeta,
  BAYI_MOCK_DOCUMENTS,
  cardVisualIcon,
  fileKindIcon,
  fileKindLabel,
  isUrgentDocument,
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
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly search = signal('');
  readonly category = signal('');
  readonly brand = signal('');
  readonly accessFilter = signal<'' | BayiDocAccessStatus>('');
  readonly visibleCount = signal(PAGE_SIZE);

  readonly categories = ['Pazarlama', 'Genel Duyuru', 'Eğitim'];

  readonly brands = computed(() => {
    const set = new Set<string>();
    for (const doc of BAYI_MOCK_DOCUMENTS) {
      for (const brand of doc.brands) {
        set.add(brand);
      }
    }
    return [...set].sort();
  });

  readonly statusCounts = computed(() => {
    const counts = { unread: 0, viewed: 0, downloaded: 0 };
    for (const doc of BAYI_MOCK_DOCUMENTS) {
      counts[doc.accessStatus] += 1;
    }
    return counts;
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.category();
    const brand = this.brand();
    const access = this.accessFilter();

    return BAYI_MOCK_DOCUMENTS.filter((d) => {
      if (cat && d.category !== cat) {
        return false;
      }
      if (brand && !d.brands.includes(brand)) {
        return false;
      }
      if (access && d.accessStatus !== access) {
        return false;
      }
      if (q) {
        const haystack = [d.title, d.category, ...d.brands].join(' ').toLowerCase();
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
    void this.router.navigate(['/bayi/documents', doc.id]);
  }

  onView(doc: BayiDocumentCard, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/bayi/documents', doc.id]);
  }

  onDownload(doc: BayiDocumentCard, event: Event): void {
    event.stopPropagation();
    // TODO: GET /api/materials/:id/download
    console.info('[mock] DOWNLOAD', doc.id);
  }

  private resetPagination(): void {
    this.visibleCount.set(PAGE_SIZE);
  }
}
