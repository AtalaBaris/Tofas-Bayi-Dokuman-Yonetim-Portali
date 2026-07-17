import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccessLog, AccessLogService } from '../../../core/services/access-log.service';

@Component({
  selector: 'app-access-logs',
  imports: [CommonModule, FormsModule],
  templateUrl: './access-logs.html',
  styleUrl: './access-logs.scss',
})
export class AccessLogs {
  private readonly accessLogService = inject(AccessLogService);

  // Filtreler
  readonly searchQuery = signal('');
  readonly selectedRole = signal('');
  readonly selectedAction = signal('');
  readonly selectedStatus = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');

  // Sayfalama
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  // Veritabanı verisi ve yüklenme durumu
  readonly logs = signal<AccessLog[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);

  readonly actionsList = [
    'Giriş',
    'Çıkış',
    'Döküman Görüntüleme',
    'Döküman İndirme',
    'Döküman Yükleme',
    'Kategori Oluşturma',
    'Kategori Güncelleme',
    'Kategori Silme',
    'Marka Oluşturma',
    'Marka Güncelleme',
    'Marka Silme',
    'Bayi Oluşturma',
    'Bayi Güncelleme',
    'Bayi Silme',
    'Kullanıcı Oluşturuldu',
    'Kullanıcı Güncellendi',
    'Şifre Değiştirildi'
  ];

  constructor() {
    // Filtreler veya sayfa numarası değiştiğinde otomatik olarak API'den verileri yükle
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

    this.accessLogService.getLogs({
      keyword: keyword.trim() || undefined,
      role: role || undefined,
      action: action || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      pageSize
    }).subscribe({
      next: (response) => {
        this.logs.set(response.items);
        this.totalCount.set(response.totalCount);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erişim logları yüklenirken hata oluştu:', err);
        this.loading.set(false);
      }
    });
  }

  // Toplam sayfa sayısı
  readonly totalPages = computed(() => {
    return Math.ceil(this.totalCount() / this.pageSize());
  });

  // Aktif sayfa numarası
  readonly activePage = computed(() => {
    const page = this.currentPage();
    const total = this.totalPages();
    if (total === 0) return 1;
    return page > total ? total : page;
  });

  // Şablon için sayfa numaraları dizisi
  readonly pageNumbers = computed(() => {
    const pages = [];
    const total = this.totalPages();
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  });

  // Sayfalama aralık gösterimi
  readonly rangeStart = computed(() => {
    if (this.totalCount() === 0) return 0;
    return (this.activePage() - 1) * this.pageSize() + 1;
  });

  readonly rangeEnd = computed(() => {
    const end = this.activePage() * this.pageSize();
    const total = this.totalCount();
    return end > total ? total : end;
  });

  // Aktif filtre var mı?
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

  // Metotlar
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

  getActionClass(action: string): string {
    const lowercase = action.toLowerCase();
    if (lowercase.includes('giriş')) return 'login';
    if (lowercase.includes('çıkış')) return 'logout';
    if (lowercase.includes('görüntüleme') || lowercase.includes('indirme')) return 'view';
    if (lowercase.includes('oluşturma') || lowercase.includes('yükleme') || lowercase.includes('oluşturuldu')) return 'create';
    if (lowercase.includes('güncelleme') || lowercase.includes('güncellendi') || lowercase.includes('değiştirildi')) return 'update';
    if (lowercase.includes('silme')) return 'delete';
    return 'default';
  }
}
