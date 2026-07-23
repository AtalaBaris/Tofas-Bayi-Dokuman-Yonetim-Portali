import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AccessLog {
  id: number;
  userName: string;
  userRole: string;
  userType: string;
  action: string;
  description: string;
  loginStatus: 'Başarılı' | 'Başarısız' | 'N/A' | string;
  date: string;
  time: string;
  ipAddress: string;
  userAgent?: string | null;
}

export interface AccessLogListResponse {
  items: AccessLog[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AccessLogQuery {
  materialId?: number;
  keyword?: string;
  role?: string;
  action?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AccessLogTrendPoint {
  label: string;
  count: number;
}

export interface AccessLogTrendResponse {
  points: AccessLogTrendPoint[];
}

@Injectable({ providedIn: 'root' })
export class AccessLogService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  getLogs(query: AccessLogQuery): Observable<AccessLogListResponse> {
    let params = new HttpParams();

    if (query.materialId != null) params = params.set('materialId', query.materialId.toString());
    if (query.keyword) params = params.set('keyword', query.keyword);
    if (query.role) params = params.set('role', query.role);
    if (query.action) params = params.set('action', query.action);
    if (query.status) params = params.set('status', query.status);
    if (query.startDate) params = params.set('startDate', query.startDate);
    if (query.endDate) params = params.set('endDate', query.endDate);
    if (query.page) params = params.set('page', query.page.toString());
    if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());

    return this.http.get<AccessLogListResponse>(`${this.api.baseUrl}/access-logs`, { params });
  }

  logLogout(): Observable<void> {
    return this.api.post<void>('/access-logs/logout', {});
  }

  getTrend(period: '30' | 'year'): Observable<AccessLogTrendResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<AccessLogTrendResponse>(`${this.api.baseUrl}/access-logs/trend`, { params });
  }
}
