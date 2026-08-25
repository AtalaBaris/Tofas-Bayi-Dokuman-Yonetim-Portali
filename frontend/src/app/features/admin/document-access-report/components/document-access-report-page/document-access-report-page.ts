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
  type AccessAction,
  type AccessReportRow,
  type AccessReportTab,
} from '../../models/document-access-report.model';

function trNormalize(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c')
    .toLowerCase();
}

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
    this.route.paramMap.pipe(map((p: any) => Number(p.get('id')) || 0)),
    { initialValue: 0 }
  );

  readonly document = signal<Material | null>(null);
  readonly realLogs = signal<AccessLog[]>([]);
  readonly reportData = signal<{
    materialId: number;
    materialTitle: string;
    audienceCount: number;
    viewedCount: number;
    pendingCount: number;
    engagementPercent: number;
    accessLogs: any[];
    pendingUsers: { userId: number; userName: string; email: string; dealerName: string }[];
  } | null>(null);

  readonly exporting = signal(false);

  readonly activeTab = signal<AccessReportTab>('viewed');
  readonly actionFilter = signal<AccessAction | ''>('');
  readonly search = signal('');
  readonly page = signal(1);
  readonly expandedDealers = signal<Set<string>>(new Set());

  toggleDealerExpand(dealerName: string): void {
    this.expandedDealers.update((set) => {
      const next = new Set(set);
      if (next.has(dealerName)) {
        next.delete(dealerName);
      } else {
        next.add(dealerName);
      }
      return next;
    });
  }

  isDealerExpanded(dealerName: string): boolean {
    return this.expandedDealers().has(dealerName);
  }

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

    this.materialsService.getAccessReport(id).subscribe({
      next: (res: any) => {
        this.reportData.set(res);
        this.realLogs.set(res.accessLogs || []);
      },
      error: () => {
        this.reportData.set(null);
        this.realLogs.set([]);
      },
    });
  }

  readonly metrics = computed(() => {
    const report = this.reportData();
    if (report) {
      return {
        audienceCount: report.audienceCount,
        viewedCount: report.viewedCount,
        pendingCount: report.pendingCount,
        engagementPercent: report.engagementPercent,
      };
    }
    const doc = this.document();
    const audience = doc?.audienceCount || 0;
    const viewed = doc?.viewedCount || 0;
    const pending = Math.max(0, audience - viewed);
    const engagementPercent = audience > 0 ? Math.round((viewed / audience) * 100) : 0;
    return {
      audienceCount: audience,
      viewedCount: viewed,
      pendingCount: pending,
      engagementPercent,
    };
  });

  private static initialsOf(name: string): string {
    const nameParts = (name || 'Kullanıcı').split(' ').filter(Boolean);
    return nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : (name?.[0] || 'K').toUpperCase();
  }

  private readonly viewedRows = computed<AccessReportRow[]>(() => {
    const doc = this.document();
    if (!doc) {
      return [];
    }

    if (this.activeTab() === 'pending') {
      const pendingUsers = this.reportData()?.pendingUsers || [];
      return pendingUsers.map((u) => {
        const initials = DocumentAccessReportPage.initialsOf(u.userName);
        return {
          id: u.userId,
          userName: u.userName,
          initials,
          dealerName: u.dealerName || 'Bayi',
          documentTitle: doc.title,
          action: null,
          date: '—',
          time: '—',
          ipAddress: u.email,
          userAgent: 'Henüz erişim gerçekleşmedi',
        };
      });
    }

    const logs = this.realLogs();
    return logs.map((log) => {
      const lower = `${log.action} ${log.description}`.toLowerCase();
      const isDownload = lower.includes('indir') || lower.includes('download');
      return {
        id: log.id,
        userName: log.userName || 'Kullanıcı',
        initials: DocumentAccessReportPage.initialsOf(log.userName),
        dealerName: log.dealerName || (log.userType !== 'Bayi Kullanıcısı' ? log.userType : null) || 'Bayi',
        documentTitle: doc.title,
        action: isDownload ? 'DOWNLOAD' : 'VIEW',
        date: log.date,
        time: log.time,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent || 'Chrome / Web Browser',
      };
    });
  });

  private readonly pendingRows = computed<AccessReportRow[]>(() => {
    const doc = this.document();
    if (!doc) {
      return [];
    }
    const pendingUsers = this.reportData()?.pendingUsers || [];
    return pendingUsers.map((user) => ({
      id: user.userId,
      userName: user.userName,
      initials: DocumentAccessReportPage.initialsOf(user.userName),
      dealerName: user.dealerName,
      documentTitle: doc.title,
      action: null,
      date: '—',
      time: '—',
      ipAddress: user.email,
      userAgent: 'Henüz erişim gerçekleşmedi',
    }));
  });

  private readonly allRows = computed<AccessReportRow[]>(() =>
    this.activeTab() === 'viewed' ? this.viewedRows() : this.pendingRows()
  );

  readonly filteredRows = computed(() => {
    const q = trNormalize(this.search().trim());
    const action = this.actionFilter();
    return this.allRows().filter((r) => {
      if (action && r.action !== action) {
        return false;
      }
      if (!q) {
        return true;
      }
      const dealer = trNormalize(r.dealerName);
      const user = trNormalize(r.userName);
      const ip = trNormalize(r.ipAddress);
      const ua = trNormalize(r.userAgent);
      const docTitle = trNormalize(r.documentTitle);

      return (
        dealer.includes(q) ||
        user.includes(q) ||
        ip.includes(q) ||
        ua.includes(q) ||
        docTitle.includes(q)
      );
    });
  });

  readonly dealerGroups = computed(() => {
    const rows = this.filteredRows();
    const map = new Map<string, AccessReportRow[]>();

    for (const row of rows) {
      const key = row.dealerName || 'Diğer Bayi';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(row);
    }

    const groups: {
      dealerName: string;
      documentTitle: string;
      latestRow: AccessReportRow;
      latestActionMeta: ReturnType<typeof accessActionMeta>;
      historyRows: { row: AccessReportRow; actionMeta: ReturnType<typeof accessActionMeta> }[];
    }[] = [];

    map.forEach((dealerRows, dealerName) => {
      // Reversing or sorting so the newest action is first (index 0)
      const sorted = [...dealerRows].reverse();
      const latestRow = sorted[0];
      const historyRows = sorted.slice(1).map((r) => ({
        row: r,
        actionMeta: accessActionMeta(r.action),
      }));

      groups.push({
        dealerName,
        documentTitle: latestRow.documentTitle,
        latestRow,
        latestActionMeta: accessActionMeta(latestRow.action),
        historyRows,
      });
    });

    return groups;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.dealerGroups().length / PAGE_SIZE))
  );

  readonly pagedGroups = computed(() => {
    const page = Math.min(this.page(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.dealerGroups().slice(start, start + PAGE_SIZE);
  });

  readonly rangeLabel = computed(() => {
    const total = this.dealerGroups().length;
    if (total === 0) {
      return '0 kayıt';
    }
    const page = Math.min(this.page(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `${start}–${end} / ${total} bayi`;
  });

  readonly tableColspan = computed(() => (this.activeTab() === 'viewed' ? 6 : 4));

  exportReport(format: 'xlsx' | 'pdf'): void {
    const id = this.documentId();
    if (!id) {
      return;
    }
    this.exporting.set(true);
    this.materialsService.exportAccessReport(id, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `okuma-raporu.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: (err) => {
        console.error('Okuma raporu dışa aktarılırken hata oluştu:', err);
        this.exporting.set(false);
      },
    });
  }

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
