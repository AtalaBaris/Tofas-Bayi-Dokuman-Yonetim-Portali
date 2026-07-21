/** Admin ana sayfa — özet metrikler ve hızlı erişim. */
import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../../../core/services/auth.service';
import { AccessLog, AccessLogService } from '../../../../../core/services/access-log.service';
import { BrandService } from '../../../../../core/services/brand.service';
import { CategoryService } from '../../../../../core/services/category.service';
import { DealerService } from '../../../../../core/services/dealer.service';
import { UserAdminService } from '../../../../../core/services/user-admin.service';
import { roleLabel } from '../../../definition-management/models/definition-management.model';
import {
  MOCK_DOCUMENTS,
  type DocumentListItem,
} from '../../../shared-docs-list-page/models/document-list.model';
import { DashboardScheduleCalendar } from '../dashboard-schedule-calendar/dashboard-schedule-calendar';

export interface DashboardActivityRow {
  id: number;
  dealerName: string;
  action: string;
  actionIcon: string;
  actionTone: 'view' | 'download';
  documentName: string;
  when: string;
}

export interface TopDocumentRow {
  doc: DocumentListItem;
  views: number;
}

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [DecimalPipe, RouterLink, DashboardScheduleCalendar],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: '../../styles/admin-dashboard-page.scss',
})
export class AdminDashboardPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly accessLogs = inject(AccessLogService);
  private readonly usersApi = inject(UserAdminService);
  private readonly dealersApi = inject(DealerService);
  private readonly brandsApi = inject(BrandService);
  private readonly categoriesApi = inject(CategoryService);

  readonly loading = signal(false);
  readonly apiHealthy = signal(true);
  readonly chartPeriod = signal<'30' | 'year'>('30');
  readonly recentLogs = signal<AccessLog[]>([]);
  readonly accessLogTotal = signal<number | null>(null);
  readonly loginLogTotal = signal<number | null>(null);
  readonly userCount = signal<number | null>(null);
  readonly dealerCount = signal<number | null>(null);
  readonly brandCount = signal<number | null>(null);
  readonly categoryCount = signal<number | null>(null);

  readonly user = computed(() => this.auth.currentUser());
  readonly isAdmin = computed(() => this.user()?.role === 'Admin');
  readonly displayName = computed(() => this.user()?.name ?? 'Kullanıcı');
  readonly roleText = computed(() => roleLabel(this.user()?.role ?? ''));

  readonly todayShort = computed(() =>
    new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
    }).format(new Date())
  );

  private readonly allDocuments = MOCK_DOCUMENTS;

  readonly documentStats = computed(() => {
    const docs = this.allDocuments;
    return {
      total: docs.length,
      active: docs.filter((d) => d.status === 'active').length,
      draft: docs.filter((d) => d.status === 'draft').length,
      archived: docs.filter((d) => d.status === 'archived').length,
    };
  });

  readonly monthlyViews = computed(() => {
    const seen = new Set<string>();
    let sum = 0;
    for (const doc of this.allDocuments) {
      if (seen.has(doc.title)) {
        continue;
      }
      seen.add(doc.title);
      sum += doc.viewedCount;
    }
    return sum;
  });

  readonly engagementTrend = computed(() => {
    const s = this.documentStats();
    if (s.total <= 0) {
      return 0;
    }
    return Math.round((s.active / s.total) * 100);
  });

  readonly statusLine = computed(() => {
    const activity = this.recentLogs().length || this.accessLogTotal() || 0;
    if (!this.apiHealthy()) {
      return `${this.todayShort()}. Bazı özet veriler yüklenemedi; liste verileri gösteriliyor.`;
    }
    if (activity > 0) {
      return `${this.todayShort()}. Sistem stabil çalışıyor ve ${activity} yeni bayi aktivitesi kaydedildi.`;
    }
    return `${this.todayShort()}. Sistem stabil çalışıyor. Henüz yeni aktivite kaydı yok.`;
  });

  readonly topDocuments = computed<TopDocumentRow[]>(() => {
    const seen = new Set<string>();
    const rows: TopDocumentRow[] = [];
    const sorted = [...this.allDocuments].sort((a, b) => b.viewedCount - a.viewedCount);
    for (const doc of sorted) {
      if (seen.has(doc.title)) {
        continue;
      }
      seen.add(doc.title);
      rows.push({ doc, views: doc.viewedCount });
      if (rows.length >= 3) {
        break;
      }
    }
    return rows;
  });

  readonly chartBars = computed(() => {
    const base =
      this.chartPeriod() === '30'
        ? [20, 35, 25, 50, 40, 75, 65, 90]
        : [30, 45, 55, 48, 70, 82, 78, 95, 88, 92, 85, 100];
    return base.map((h, i) => ({ label: `${i + 1}`, height: h }));
  });

  readonly chartLinePoints = computed(() => {
    const bars = this.chartBars();
    if (bars.length < 2) {
      return '';
    }
    const step = 100 / (bars.length - 1);
    return bars
      .map((b, i) => {
        const x = i * step;
        const y = 100 - b.height;
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  });

  readonly activityRows = computed<DashboardActivityRow[]>(() => {
    const logs = this.recentLogs();
    if (logs.length > 0) {
      return logs.map((log) => this.mapLogToActivity(log));
    }
    return MOCK_ACTIVITY;
  });

  readonly storagePercent = computed(() => {
    const totalMb = this.allDocuments.reduce((sum, d) => {
      const match = d.sizeLabel.match(/[\d.]+/);
      return sum + (match ? Number(match[0]) : 0);
    }, 0);
    const cap = 500;
    return Math.min(95, Math.max(12, Math.round((totalMb / cap) * 100)));
  });

  readonly storageLabel = computed(() => {
    const used = Math.round((this.storagePercent() / 100) * 500);
    return `${used} GB / 500 GB`;
  });

  ngOnInit(): void {
    this.loadSummary();
  }

  setChartPeriod(period: '30' | 'year'): void {
    this.chartPeriod.set(period);
  }

  docIcon(kind: DocumentListItem['fileKind']): string {
    switch (kind) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'video':
        return 'video_library';
      default:
        return 'description';
    }
  }

  formatViews(n: number): string {
    if (n >= 1000) {
      return `${(n / 1000).toFixed(1).replace('.0', '')}K`;
    }
    return String(n);
  }

  private loadSummary(): void {
    this.loading.set(true);

    const applyResult = (r: {
      recentLogs: { items: AccessLog[] };
      accessTotal: { totalCount: number };
      loginTotal: { totalCount: number };
      users?: unknown[];
      dealers?: unknown[];
      brands?: unknown[];
      categories?: unknown[];
    }) => {
      this.recentLogs.set(r.recentLogs.items);
      this.accessLogTotal.set(r.accessTotal.totalCount);
      this.loginLogTotal.set(r.loginTotal.totalCount);
      if (r.users) {
        this.userCount.set(r.users.length);
      }
      if (r.dealers) {
        this.dealerCount.set(r.dealers.length);
      }
      if (r.brands) {
        this.brandCount.set(r.brands.length);
      }
      if (r.categories) {
        this.categoryCount.set(r.categories.length);
      }
      this.apiHealthy.set(true);
      this.loading.set(false);
    };

    const logRequests = {
      recentLogs: this.accessLogs
        .getLogs({ page: 1, pageSize: 6 })
        .pipe(catchError(() => of({ items: [], totalCount: 0, page: 1, pageSize: 6 }))),
      accessTotal: this.accessLogs
        .getLogs({ page: 1, pageSize: 1 })
        .pipe(catchError(() => of({ items: [], totalCount: 0, page: 1, pageSize: 1 }))),
      loginTotal: this.accessLogs
        .getLogs({ action: 'Giriş,Çıkış', page: 1, pageSize: 1 })
        .pipe(catchError(() => of({ items: [], totalCount: 0, page: 1, pageSize: 1 }))),
    };

    if (!this.isAdmin()) {
      forkJoin(logRequests).subscribe({
        next: applyResult,
        error: () => {
          this.apiHealthy.set(false);
          this.loading.set(false);
        },
      });
      return;
    }

    forkJoin({
      ...logRequests,
      users: this.usersApi.list().pipe(catchError(() => of([]))),
      dealers: this.dealersApi.list().pipe(catchError(() => of([]))),
      brands: this.brandsApi.list().pipe(catchError(() => of([]))),
      categories: this.categoriesApi.list().pipe(catchError(() => of([]))),
    }).subscribe({
      next: applyResult,
      error: () => {
        this.apiHealthy.set(false);
        this.loading.set(false);
      },
    });
  }

  private mapLogToActivity(log: AccessLog): DashboardActivityRow {
    const lower = `${log.action} ${log.description}`.toLowerCase();
    const isDownload = lower.includes('indir') || lower.includes('download');
    return {
      id: log.id,
      dealerName: log.userType?.trim() || log.userRole || 'Bayi',
      action: isDownload ? 'İndirdi' : 'Görüntüledi',
      actionIcon: isDownload ? 'download' : 'visibility',
      actionTone: isDownload ? 'download' : 'view',
      documentName: log.description || log.action,
      when: `${log.date} ${log.time}`.trim(),
    };
  }
}

const MOCK_ACTIVITY: DashboardActivityRow[] = [
  {
    id: 1,
    dealerName: 'Fiat Ankara',
    action: 'İndirdi',
    actionIcon: 'download',
    actionTone: 'download',
    documentName: 'Haziran Pazarlama Kampanyası',
    when: '10 dk önce',
  },
  {
    id: 2,
    dealerName: 'Renault İstanbul Merkez',
    action: 'Görüntüledi',
    actionIcon: 'visibility',
    actionTone: 'view',
    documentName: '2024 Ürün Yol Haritası Sunumu',
    when: '45 dk önce',
  },
  {
    id: 3,
    dealerName: 'Jeep Bursa',
    action: 'İndirdi',
    actionIcon: 'download',
    actionTone: 'download',
    documentName: 'Yeni Bayi Yönergeleri 3. Çeyrek',
    when: '2 saat önce',
  },
  {
    id: 4,
    dealerName: 'Metro Otomotiv',
    action: 'Görüntüledi',
    actionIcon: 'visibility',
    actionTone: 'view',
    documentName: 'Peugeot Servis Bülteni Taslağı',
    when: '5 saat önce',
  },
];
