/** Admin sol menü — tüm yönetim sayfalarında kullanılır. */
import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
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
  private readonly destroyRef = inject(DestroyRef);

  readonly mobileOpen = input(false);
  readonly closed = output<void>();
  readonly documentsMenuOpen = signal(false);
  readonly usersMenuOpen = signal(false);

  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'Admin');

  readonly navItems: AdminNavItem[] = [
    { label: 'Ana Sayfa', icon: 'dashboard', link: '/admin/dashboard' },
    { label: 'Son Yüklenenler', icon: 'history', link: null },
  ];

  constructor() {
    this.syncMenusToUrl(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => this.syncMenusToUrl(event.urlAfterRedirects));
  }

  toggleDocumentsMenu(): void {
    this.documentsMenuOpen.update((open) => !open);
  }

  toggleUsersMenu(): void {
    this.usersMenuOpen.update((open) => !open);
    void this.router.navigateByUrl('/admin/definitions/users');
  }

  onNavClick(): void {
    this.closed.emit();
  }

  private syncMenusToUrl(url: string): void {
    this.documentsMenuOpen.set(url.startsWith('/admin/documents'));
    this.usersMenuOpen.set(url.startsWith('/admin/definitions'));
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.afterLogout(),
      error: () => this.afterLogout(),
    });
  }

  private afterLogout(): void {
    this.closed.emit();
    void this.router.navigateByUrl('/admin/login');
  }
}
