import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type {
  CategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../models/definition.models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<CategoryDto[]>('/categories');
  }

  getById(id: number) {
    return this.api.get<CategoryDto>(`/categories/${id}`);
  }

  create(body: CreateCategoryDto) {
    return this.api.post<CategoryDto>('/categories', body);
  }

  update(id: number, body: UpdateCategoryDto) {
    return this.api.put<CategoryDto>(`/categories/${id}`, body);
  }

  remove(id: number) {
    return this.api.delete<void>(`/categories/${id}`);
  }
}
