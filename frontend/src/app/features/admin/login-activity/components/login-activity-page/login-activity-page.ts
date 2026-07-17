import { Component, computed, signal } from '@angular/core';
import {
  MOCK_LOGIN_ACTIVITY,
  formatLoginDate,
  type LoginAttemptStatus,
  type LoginPortal,
} from '../../models/login-activity.model';

export type LoginActivityFilter = 'all' | LoginAttemptStatus;

@Component({
  selector: 'app-login-activity-page',
  templateUrl: './login-activity-page.html',
  styleUrl: '../../styles/login-activity-page.scss',
})
export class LoginActivityPage {
  readonly search = signal('');
  readonly statusFilter = signal<LoginActivityFilter>('all');
  readonly formatDate = formatLoginDate;

  readonly rows = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('tr-TR');
    const status = this.statusFilter();

    return MOCK_LOGIN_ACTIVITY.filter((row) => {
      if (status !== 'all' && row.status !== status) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [row.email, row.ipAddress, row.userAgent, row.failureReason ?? '']
        .join(' ')
        .toLocaleLowerCase('tr-TR')
        .includes(query);
    });
  });

  readonly successCount = computed(
    () => MOCK_LOGIN_ACTIVITY.filter((row) => row.status === 'success').length
  );
  readonly failureCount = computed(
    () => MOCK_LOGIN_ACTIVITY.filter((row) => row.status === 'failure').length
  );

  setFilter(filter: LoginActivityFilter): void {
    this.statusFilter.set(filter);
  }

  portalLabel(portal: LoginPortal): string {
    return portal === 'admin' ? 'Admin' : 'Bayi';
  }

  statusLabel(status: LoginAttemptStatus): string {
    return status === 'success' ? 'Başarılı' : 'Başarısız';
  }
}
