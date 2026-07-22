/** Doküman bazlı erişim raporu (şimdilik mock veri — README FR-09 / FR-12 alanları). */
import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  MOCK_DOCUMENTS,
  type DocumentListItem,
} from '../../../shared-docs-list-page/models/document-list.model';
import {
  accessActionMeta,
  buildMockAccessRows,
  buildMockMetrics,
  type AccessAction,
  type AccessReportRow,
  type AccessReportTab,
} from '../../models/document-access-report.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-document-access-report-page',
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './document-access-report-page.html',
  styleUrl: '../../styles/document-access-report-page.scss',
})
export class DocumentAccessReportPage {
  private readonly route = inject(ActivatedRoute);

  private readonly documentId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')) || 0)),
    { initialValue: 0 }
  );

  readonly activeTab = signal<AccessReportTab>('viewed');
  /** FR-12: aksiyon filtresi (VIEW / DOWNLOAD). */
  readonly actionFilter = signal<AccessAction | ''>('');
  readonly search = signal('');
  readonly page = signal(1);

  readonly document = computed<DocumentListItem | null>(() => {
    const id = this.documentId();
    return MOCK_DOCUMENTS.find((d) => d.id === id) ?? MOCK_DOCUMENTS[0] ?? null;
  });

  readonly metrics = computed(() => {
    const doc = this.document();
    if (!doc) {
      return buildMockMetrics(0, 0);
    }
    return buildMockMetrics(doc.viewedCount, doc.audienceCount);
  });

  private readonly allRows = computed(() => {
    const doc = this.document();
    const tab = this.activeTab();
    if (!doc) {
      return [] as AccessReportRow[];
    }
    const count = tab === 'viewed' ? this.metrics().viewedCount : this.metrics().pendingCount;
    const minDemo = tab === 'viewed' ? 12 : 7;
    const demoCount = Math.min(Math.max(count, minDemo), tab === 'viewed' ? 24 : 14);
    return buildMockAccessRows(doc.id, doc.title, tab, demoCount);
  });

  readonly filteredRows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const action = this.actionFilter();
    return this.allRows().filter((r) => {
      if (action && r.action !== action) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        r.dealerName.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        (r.ipAddress?.toLowerCase().includes(q) ?? false)
      );
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / PAGE_SIZE))
  );

  readonly pagedRows = computed(() => {
    const page = Math.min(this.page(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredRows().slice(start, start + PAGE_SIZE);
  });

  /** Aynı bayinin peş peşe satırlarında bayi hücresini birleştirmek için. */
  readonly pagedDisplay = computed(() => {
    const rows = this.pagedRows();
    return rows.map((row, index) => {
      const prev = index > 0 ? rows[index - 1] : null;
      const showDealer = !prev || prev.dealerName !== row.dealerName;
      let dealerRowSpan = 1;
      if (showDealer) {
        for (let i = index + 1; i < rows.length; i++) {
          if (rows[i].dealerName !== row.dealerName) {
            break;
          }
          dealerRowSpan++;
        }
      }
      return { row, showDealer, dealerRowSpan, action: accessActionMeta(row.action) };
    });
  });

  readonly rangeLabel = computed(() => {
    const total = this.filteredRows().length;
    if (total === 0) {
      return '0 kayıt';
    }
    const page = Math.min(this.page(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `${start}–${end} / ${total}`;
  });

  readonly tableColspan = computed(() => (this.activeTab() === 'viewed' ? 7 : 3));

  setTab(tab: AccessReportTab): void {
    this.activeTab.set(tab);
    this.actionFilter.set('');
    this.page.set(1);
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onActionFilter(value: AccessAction | ''): void {
    this.actionFilter.set(value);
    this.page.set(1);
  }

  prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }
}
