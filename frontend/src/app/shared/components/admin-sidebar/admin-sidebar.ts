/** Admin sol menü — tüm yönetim sayfalarında kullanılır. */
import { Component, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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

  readonly mobileOpen = input(false);
  readonly closed = output<void>();
  readonly usersMenuOpen = signal(this.router.url.startsWith('/admin/definitions'));

  readonly navItems: AdminNavItem[] = [
    { label: 'Dokümanlar', icon: 'description', link: '/admin/documents' },
    { label: 'Son Yüklenenler', icon: 'history', link: null },
  ];

  toggleUsersMenu(): void {
    this.usersMenuOpen.update((open) => !open);
    void this.router.navigateByUrl('/admin/definitions/users');
  }

  onNavClick(): void {
    this.closed.emit();
  }

  logout(): void {
    this.auth.logout();
    this.closed.emit();
    void this.router.navigateByUrl('/admin/login');
  }
}
