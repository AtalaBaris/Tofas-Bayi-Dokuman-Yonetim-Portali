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
import { MaterialsService } from '../../../../../core/services/materials.service';
import { UserAdminService } from '../../../../../core/services/user-admin.service';
import { Material } from '../../../../../core/models/material.interface';
import { roleLabel } from '../../../definition-management/models/definition-management.model';
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
  id: number;
  title: string;
  categoryName: string;
  fileKind: 'pdf' | 'video' | 'doc';
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
  private readonly materialsService = inject(MaterialsService);
  private readonly usersApi = inject(UserAdminService);
  private readonly dealersApi = inject(DealerService);
  private readonly brandsApi = inject(BrandService);
  private readonly categoriesApi = inject(CategoryService);

  readonly loading = signal(false);
  readonly apiHealthy = signal(true);
  readonly chartPeriod = signal<'30' | 'year'>('30');
  readonly recentLogs = signal<AccessLog[]>([]);
  readonly materials = signal<Material[]>([]);
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

  readonly documentStats = computed(() => {
    const docs = this.materials();
    return {
      total: docs.length,
      active: docs.filter((d) => d.status.toLowerCase() === 'active').length,
      draft: docs.filter((d) => d.status.toLowerCase() === 'draft').length,
      archived: docs.filter((d) => d.status.toLowerCase() === 'archived').length,
    };
  });

  readonly monthlyViews = computed(() => {
    return this.materials().reduce((sum, d) => sum + (d.viewedCount || 0), 0);
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
    const sorted = [...this.materials()].sort((a, b) => (b.viewedCount || 0) - (a.viewedCount || 0));
    return sorted.slice(0, 3).map((m) => ({
      id: m.id,
      title: m.title,
      categoryName: m.categoryName,
      fileKind: m.mimeType?.includes('pdf')
        ? 'pdf'
        : m.mimeType?.includes('video')
        ? 'video'
        : 'doc',
      views: m.viewedCount || 0,
    }));
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
    return logs.map((log) => this.mapLogToActivity(log));
  });

  readonly storagePercent = computed(() => {
    const totalBytes = this.materials().reduce((sum, d) => sum + (d.fileSize || 0), 0);
    const totalMb = totalBytes / (1024 * 1024);
    const capMb = 500 * 1024; // 500 GB in MB
    return Math.min(95, Math.max(1, Math.round((totalMb / capMb) * 100)));
  });

  readonly storageLabel = computed(() => {
    const totalBytes = this.materials().reduce((sum, d) => sum + (d.fileSize || 0), 0);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
    return `${totalMb} MB / 500 GB`;
  });

  ngOnInit(): void {
    this.loadSummary();
  }

  setChartPeriod(period: '30' | 'year'): void {
    this.chartPeriod.set(period);
  }

  docIcon(kind: TopDocumentRow['fileKind']): string {
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
      materials: Material[];
      users?: unknown[];
      dealers?: unknown[];
      brands?: unknown[];
      categories?: unknown[];
    }) => {
      this.recentLogs.set(r.recentLogs.items);
      this.accessLogTotal.set(r.accessTotal.totalCount);
      this.loginLogTotal.set(r.loginTotal.totalCount);
      this.materials.set(r.materials);
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

    const commonRequests = {
      recentLogs: this.accessLogs
        .getLogs({ page: 1, pageSize: 6 })
        .pipe(catchError(() => of({ items: [], totalCount: 0, page: 1, pageSize: 6 }))),
      accessTotal: this.accessLogs
        .getLogs({ page: 1, pageSize: 1 })
        .pipe(catchError(() => of({ items: [], totalCount: 0, page: 1, pageSize: 1 }))),
      loginTotal: this.accessLogs
        .getLogs({ action: 'Giriş,Çıkış', page: 1, pageSize: 1 })
        .pipe(catchError(() => of({ items: [], totalCount: 0, page: 1, pageSize: 1 }))),
      materials: this.materialsService
        .list()
        .pipe(catchError(() => of([]))),
    };

    if (!this.isAdmin()) {
      forkJoin(commonRequests).subscribe({
        next: applyResult,
        error: () => {
          this.apiHealthy.set(false);
          this.loading.set(false);
        },
      });
      return;
    }

    forkJoin({
      ...commonRequests,
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
