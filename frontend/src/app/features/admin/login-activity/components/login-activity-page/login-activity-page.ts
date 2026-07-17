import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccessLog, AccessLogService } from '../../../../../core/services/access-log.service';

@Component({
  selector: 'app-login-activity-page',
  imports: [FormsModule],
  templateUrl: './login-activity-page.html',
  styleUrl: '../../../access-logs/access-logs.scss',
})
export class LoginActivityPage {
  private readonly accessLogService = inject(AccessLogService);

  readonly searchQuery = signal('');
  readonly selectedRole = signal('');
  readonly selectedAction = signal('');
  readonly selectedStatus = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');

  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly logs = signal<AccessLog[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);

  /** Giriş kayıtları sayfası — oturum açma / kapatma işlemleri. */
  readonly actionsList = ['Giriş', 'Çıkış'];

  constructor() {
    effect(() => {
      const keyword = this.searchQuery();
      const role = this.selectedRole();
      const action = this.selectedAction();
      const status = this.selectedStatus();
      const start = this.startDate();
      const end = this.endDate();
      const page = this.currentPage();
      const pageSize = this.pageSize();

      this.loadLogsFromApi(keyword, role, action, status, start, end, page, pageSize);
    });
  }

  private loadLogsFromApi(
    keyword: string,
    role: string,
    action: string,
    status: string,
    startDate: string,
    endDate: string,
    page: number,
    pageSize: number
  ): void {
    this.loading.set(true);

    this.accessLogService
      .getLogs({
        keyword: keyword.trim() || undefined,
        role: role || undefined,
        // Varsayılan: giriş + çıkış; kullanıcı tek işlem seçerse onu getir
        action: action || 'Giriş,Çıkış',
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        pageSize,
      })
      .subscribe({
        next: (response) => {
          this.logs.set(response.items);
          this.totalCount.set(response.totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Giriş kayıtları yüklenirken hata oluştu:', err);
          this.logs.set([]);
          this.totalCount.set(0);
          this.loading.set(false);
        },
      });
  }

  readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  readonly activePage = computed(() => {
    const page = this.currentPage();
    const total = this.totalPages();
    if (total === 0) return 1;
    return page > total ? total : page;
  });

  readonly pageNumbers = computed(() => {
    const pages: number[] = [];
    const total = this.totalPages();
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  });

  readonly rangeStart = computed(() => {
    if (this.totalCount() === 0) return 0;
    return (this.activePage() - 1) * this.pageSize() + 1;
  });

  readonly rangeEnd = computed(() => {
    const end = this.activePage() * this.pageSize();
    const total = this.totalCount();
    return end > total ? total : end;
  });

  readonly hasAnyFilterActive = computed(() => {
    return (
      !!this.searchQuery().trim() ||
      !!this.selectedRole() ||
      !!this.selectedAction() ||
      !!this.selectedStatus() ||
      !!this.startDate() ||
      !!this.endDate()
    );
  });

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  prevPage(): void {
    const curr = this.activePage();
    if (curr > 1) {
      this.currentPage.set(curr - 1);
    }
  }

  nextPage(): void {
    const curr = this.activePage();
    if (curr < this.totalPages()) {
      this.currentPage.set(curr + 1);
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedRole.set('');
    this.selectedAction.set('');
    this.selectedStatus.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.currentPage.set(1);
  }

  roleLabel(role: string): string {
    const key = role.toLowerCase();
    if (key === 'contentmanager') return 'İçerik Yöneticisi';
    if (key === 'dealer' || key === 'dealeruser') return 'Bayi';
    if (key === 'guest') return 'Ziyaretçi';
    return role;
  }

  getActionClass(action: string): string {
    const lowercase = action.toLowerCase();
    if (lowercase.includes('giriş')) return 'login';
    if (lowercase.includes('çıkış')) return 'logout';
    return 'default';
  }
}
