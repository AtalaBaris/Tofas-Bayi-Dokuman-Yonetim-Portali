import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AccessLog {
  id: string;
  userName: string;
  userRole: string;
  userType: 'Yönetici' | 'İçerik Yöneticisi' | 'Bayi Kullanıcısı';
  action: string;
  description: string;
  loginStatus: 'Başarılı' | 'Başarısız' | 'N/A';
  date: string;
  time: string;
  ipAddress: string;
}

export interface AccessLogListResponse {
  items: AccessLog[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class AccessLogService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient); // standard HttpClient for constructing params if needed

  getLogs(query: {
    keyword?: string;
    role?: string;
    action?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Observable<AccessLogListResponse> {
    let params = new HttpParams();

    if (query.keyword) params = params.set('keyword', query.keyword);
    if (query.role) params = params.set('role', query.role);
    if (query.action) params = params.set('action', query.action);
    if (query.status) params = params.set('status', query.status);
    if (query.startDate) params = params.set('startDate', query.startDate);
    if (query.endDate) params = params.set('endDate', query.endDate);
    if (query.page) params = params.set('page', query.page.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());

    // Call API using http client or custom path
    return this.http.get<AccessLogListResponse>(`${this.api.baseUrl}/access-logs`, { params });
  }

  logLogout(): Observable<void> {
    return this.api.post<void>('/access-logs/logout', {});
  }
}
