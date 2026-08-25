/** Bayi in-app bildirimleri — GET /api/notifications. */
import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface NotificationDto {
  id: number;
  kind: string;
  title: string;
  body: string;
  materialId?: number | null;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<NotificationDto[]>('/notifications');
  }

  markRead(id: number) {
    return this.api.post<void>(`/notifications/${id}/read`, {});
  }

  markAllRead() {
    return this.api.post<void>('/notifications/read-all', {});
  }
}
