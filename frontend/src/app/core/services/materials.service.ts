/** İçerik listeleme/detay/indirme — backend yetki+marka eşleşme kuralını zaten uyguluyor. */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import type { Material } from '../models/material.interface';

export interface MaterialListQuery {
  categoryId?: number;
  brandId?: number;
  keyword?: string;
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
    return this.http.get<Material[]>(`${this.api.baseUrl}/materials`, { params });
  }

  getById(id: number) {
    return this.api.get<Material>(`/materials/${id}`);
  }

  download(id: number) {
    return this.http.get(`${this.api.baseUrl}/materials/${id}/download`, {
      responseType: 'blob',
    });
  }

  archive(id: number) {
    return this.api.delete<void>(`/materials/${id}`);
  }
}
