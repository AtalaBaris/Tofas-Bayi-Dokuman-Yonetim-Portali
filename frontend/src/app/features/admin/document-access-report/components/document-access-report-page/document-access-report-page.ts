/** Doküman bazlı erişim raporu (gerçek API entegrasyonu). */
import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Material } from '../../../../../core/models/material.interface';
import { AccessLog, AccessLogService } from '../../../../../core/services/access-log.service';
import { MaterialsService } from '../../../../../core/services/materials.service';
import {
  accessActionMeta,
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
  private readonly materialsService = inject(MaterialsService);
  private readonly accessLogsService = inject(AccessLogService);

  private readonly documentId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')) || 0)),
    { initialValue: 0 }
  );

  readonly document = signal<Material | null>(null);
  readonly realLogs = signal<AccessLog[]>([]);
  readonly activeTab = signal<AccessReportTab>('viewed');
  readonly actionFilter = signal<AccessAction | ''>('');
  readonly search = signal('');
  readonly page = signal(1);

  constructor() {
    effect(() => {
      const id = this.documentId();
      if (id > 0) {
        this.loadData(id);
      }
    });
  }

  private loadData(id: number): void {
    this.materialsService.getById(id).subscribe({
      next: (doc) => this.document.set(doc),
      error: () => this.document.set(null),
    });

    this.accessLogsService.getLogs({ materialId: id, pageSize: 100 }).subscribe({
      next: (res) => this.realLogs.set(res.items),
      error: () => this.realLogs.set([]),
    });
  }

  readonly metrics = computed(() => {
    const doc = this.document();
    if (!doc) {
      return buildMockMetrics(0, 0);
    }
    return buildMockMetrics(doc.viewedCount || 0, doc.audienceCount || 0);
  });

  private readonly allRows = computed<AccessReportRow[]>(() => {
    const doc = this.document();
    if (!doc) {
      return [];
    }
    const logs = this.realLogs();
    return logs.map((log) => {
      const lower = `${log.action} ${log.description}`.toLowerCase();
      const isDownload = lower.includes('indir') || lower.includes('download');
      const nameParts = (log.userName || 'Kullanıcı').split(' ');
      const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : (log.userName?.[0] || 'K').toUpperCase();

      return {
        id: log.id,
        userName: log.userName || 'Kullanıcı',
        initials,
        dealerName: log.userType || log.userRole || 'Bayi',
        documentTitle: doc.title,
        action: isDownload ? 'DOWNLOAD' : 'VIEW',
        date: log.date,
        time: log.time,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent || 'Chrome / Web Browser',
      };
    });
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
