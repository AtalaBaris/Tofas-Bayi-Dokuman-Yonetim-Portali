import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { BrandDto, CreateBrandDto, UpdateBrandDto } from '../models/definition.models';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<BrandDto[]>('/brands');
  }

  getById(id: number) {
    return this.api.get<BrandDto>(`/brands/${id}`);
  }

  create(body: CreateBrandDto) {
    return this.api.post<BrandDto>('/brands', body);
  }

  update(id: number, body: UpdateBrandDto) {
    return this.api.put<BrandDto>(`/brands/${id}`, body);
  }

  remove(id: number) {
    return this.api.delete<void>(`/brands/${id}`);
  }
}
