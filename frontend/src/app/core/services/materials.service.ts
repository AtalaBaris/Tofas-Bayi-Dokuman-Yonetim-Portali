/** İçerik listeleme/detay/indirme/oluşturma — backend yetki+marka eşleşme kuralını zaten uyguluyor. */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import type { Material, MaterialScheduleItem } from '../models/material.interface';

export interface MaterialListQuery {
  categoryId?: number;
  brandId?: number;
  keyword?: string;
  status?: string;
}

export interface CreateMaterialPayload {
  title: string;
  description: string;
  categoryId: number;
  brandIds: number[];
  expiresAt?: string | null;
  status: 'Draft' | 'Active' | 'Scheduled';
  scheduledPublishAt?: string | null;
  recurrenceKind?: 'None' | 'Weekly' | 'MonthlyDay';
  recurrenceDayOfWeek?: number | null;
  recurrenceDayOfMonth?: number | null;
  files: File[];
}

export interface UpdateMaterialSchedulePayload {
  scheduledPublishAt: string;
  recurrenceKind?: 'None' | 'Weekly' | 'MonthlyDay';
  recurrenceDayOfWeek?: number | null;
  recurrenceDayOfMonth?: number | null;
}

export interface MaterialAccessReportPendingUser {
  id: number;
  userName: string;
  dealerName: string;
}

export interface MaterialAccessReport {
  materialId: number;
  items: unknown[];
  pendingUsers: MaterialAccessReportPendingUser[];
}

export interface UpdateMaterialPayload {
  title: string;
  description: string;
  categoryId: number;
  brandIds: number[];
  expiresAt?: string | null;
  files?: File[];
}

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  list(query: MaterialListQuery = {}) {
    let params = new HttpParams();
    if (query.categoryId != null) {
      params = params.set('categoryId', query.categoryId);
    }
    if (query.brandId != null) {
      params = params.set('brandId', query.brandId);
    }
    if (query.keyword) {
      params = params.set('keyword', query.keyword);
    }
    if (query.status) {
      params = params.set('status', query.status);
    }
    return this.http.get<Material[]>(`${this.api.baseUrl}/materials`, { params });
  }

  getSchedule(from: string, to: string) {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<MaterialScheduleItem[]>(`${this.api.baseUrl}/materials/schedule`, {
      params,
    });
  }

  getById(id: number) {
    return this.api.get<Material>(`/materials/${id}`);
  }

  download(id: number) {
    return this.http.get(`${this.api.baseUrl}/materials/${id}/download`, {
      responseType: 'blob',
    });
  }

  downloadFile(materialId: number, fileId: number) {
    return this.http.get(`${this.api.baseUrl}/materials/${materialId}/files/${fileId}/download`, {
      responseType: 'blob',
    });
  }

  create(payload: CreateMaterialPayload) {
    const form = new FormData();
    form.append('Title', payload.title);
    form.append('Description', payload.description);
    form.append('CategoryId', String(payload.categoryId));
    form.append('Status', payload.status);
    for (const brandId of payload.brandIds) {
      form.append('BrandIds', String(brandId));
    }
    if (payload.expiresAt) {
      form.append('ExpiresAt', payload.expiresAt);
    }
    if (payload.scheduledPublishAt) {
      form.append('ScheduledPublishAt', payload.scheduledPublishAt);
    }
    if (payload.recurrenceKind) {
      form.append('RecurrenceKind', payload.recurrenceKind);
    }
    if (payload.recurrenceDayOfWeek != null) {
      form.append('RecurrenceDayOfWeek', String(payload.recurrenceDayOfWeek));
    }
    if (payload.recurrenceDayOfMonth != null) {
      form.append('RecurrenceDayOfMonth', String(payload.recurrenceDayOfMonth));
    }
    for (const file of payload.files) {
      form.append('Files', file, file.name);
    }
    return this.http.post<Material>(`${this.api.baseUrl}/materials`, form);
  }

  update(id: number, payload: UpdateMaterialPayload) {
    const form = new FormData();
    form.append('Title', payload.title);
    form.append('Description', payload.description);
    form.append('CategoryId', String(payload.categoryId));
    for (const brandId of payload.brandIds) {
      form.append('BrandIds', String(brandId));
    }
    if (payload.expiresAt) {
      form.append('ExpiresAt', payload.expiresAt);
    }
    if (payload.files && payload.files.length > 0) {
      for (const file of payload.files) {
        form.append('Files', file, file.name);
      }
    }
    return this.http.put<Material>(`${this.api.baseUrl}/materials/${id}`, form);
  }

  updateSchedule(id: number, payload: UpdateMaterialSchedulePayload) {
    return this.api.put<Material>(`/materials/${id}/schedule`, payload);
  }

  createScheduledCopy(id: number, payload: UpdateMaterialSchedulePayload) {
    return this.api.post<Material>(`/materials/${id}/schedule-copies`, payload);
  }

  publishNow(id: number) {
    return this.api.post<Material>(`/materials/${id}/publish-now`, {});
  }

  cancelSchedule(id: number) {
    return this.api.post<Material>(`/materials/${id}/cancel-schedule`, {});
  }

  archive(id: number) {
    return this.api.delete<void>(`/materials/${id}`);
  }

  getAccessReport(id: number) {
    return this.api.get<MaterialAccessReport>(`/materials/${id}/access-report`);
  }
}
