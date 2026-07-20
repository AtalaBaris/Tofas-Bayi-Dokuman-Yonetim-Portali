/** Bayi alanı kabuğu — üst bar + içerik. */
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { dealerDisplayName } from '../../../home/models/bayi-home.model';
import {
  BAYI_MOCK_NOTIFICATIONS,
  type BayiNotification,
} from '../../models/bayi-notifications.model';

@Component({
  selector: 'app-bayi-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './bayi-shell.html',
  styleUrl: './bayi-shell.scss',
})
export class BayiShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationsRoot = viewChild<ElementRef<HTMLElement>>('notificationsRoot');

  readonly menuOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly notifications = signal<BayiNotification[]>(
    BAYI_MOCK_NOTIFICATIONS.map((n) => ({ ...n }))
  );

  readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.isRead).length
  );

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  readonly userName = () => this.auth.currentUser()?.name ?? 'Kullanıcı';
  readonly userEmail = () => this.auth.currentUser()?.email ?? '';
  readonly dealerName = () => dealerDisplayName(this.auth.currentUser()?.dealerId);
  readonly initials = () => {
    const name = this.userName().trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'BK';
  };

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const root = this.notificationsRoot()?.nativeElement;
    if (root && !root.contains(event.target as Node)) {
      this.notificationsOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.notificationsOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update((value) => !value);
    this.notificationsOpen.set(false);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((value) => !value);
    this.closeMenu();
  }

  markAllRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, isRead: true })));
  }

  openNotification(notification: BayiNotification): void {
    this.notifications.update((items) =>
      items.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item
      )
    );

    this.notificationsOpen.set(false);

    if (notification.documentId) {
      void this.router.navigate(['/bayi/documents', notification.documentId]);
    }
  }

  goToProfile(): void {
    this.notificationsOpen.set(false);
    this.closeMenu();
    void this.router.navigate(['/bayi/profile']);
  }

  goToSettings(): void {
    this.notificationsOpen.set(false);
    this.closeMenu();
    void this.router.navigate(['/bayi/settings']);
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.afterLogout(),
      error: () => this.afterLogout(),
    });
  }

  private afterLogout(): void {
    this.closeMenu();
    this.notificationsOpen.set(false);
    void this.router.navigateByUrl('/login');
  }
}
