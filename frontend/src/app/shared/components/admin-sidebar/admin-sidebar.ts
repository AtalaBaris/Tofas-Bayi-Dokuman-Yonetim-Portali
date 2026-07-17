/** Admin sol menü — tüm yönetim sayfalarında kullanılır. */
import { Component, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AccessLogService } from '../../../core/services/access-log.service';

export interface AdminNavItem {
  label: string;
  icon: string;
  /** Gerçek route; yoksa yakında (pasif). */
  link: string | null;
}

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
})
export class AdminSidebar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly accessLogService = inject(AccessLogService);

  readonly mobileOpen = input(false);
  readonly closed = output<void>();

  readonly navItems: AdminNavItem[] = [
    { label: 'Dokümanlar', icon: 'description', link: '/admin/documents' },
    { label: 'Son Yüklenenler', icon: 'history', link: null },
    { label: 'Bayi Ayarları', icon: 'settings', link: null },
    { label: 'Sistem Kayıtları', icon: 'terminal', link: '/admin/access-logs' },
  ];

  onNavClick(): void {
    this.closed.emit();
  }

  logout(): void {
    // Send logout log to backend before clearing credentials
    this.accessLogService.logLogout().subscribe({
      next: () => this.performLocalLogout(),
      error: () => this.performLocalLogout() // fallback if server is unreachable
    });
  }

  private performLocalLogout(): void {
    this.auth.logout();
    this.closed.emit();
    void this.router.navigateByUrl('/admin/login');
  }
}
