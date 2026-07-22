/** Paylaşılan doküman listesi sayfası (admin). */
import { Component, computed, effect, signal } from '@angular/core';
import { DocsListHeader } from '../docs-list-header/docs-list-header';
import { DocsListFilters } from '../docs-list-filters/docs-list-filters';
import { DocsListTabs } from '../docs-list-tabs/docs-list-tabs';
import { DocsListRow } from '../docs-list-row/docs-list-row';
import { DocsDetailDrawer } from '../docs-detail-drawer/docs-detail-drawer';
import { docsListAnimations } from '../../animations/docs-list.animations';
import {
  MOCK_DOCUMENTS,
  MOCK_VIEWERS,
  type DocumentListItem,
  type DocumentStatusTab,
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
  readonly documents = signal<DocumentListItem[]>(MOCK_DOCUMENTS.map((d) => ({ ...d })));
  readonly search = signal('');
  readonly category = signal('');
  readonly brands = signal<string[]>([]);
  readonly statusTab = signal<DocumentStatusTab>('all');
  readonly selected = signal<DocumentListItem | null>(null);
  readonly viewers = MOCK_VIEWERS;
  readonly visibleCount = signal(PAGE_SIZE);
  readonly loadingMore = signal(false);

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
    this.documents.update((list) =>
      list.map((item) => (item.id === doc.id ? { ...item, status: 'archived' as const } : item))
    );
    if (this.selected()?.id === doc.id) {
      this.selected.set(null);
    }
  }
}
