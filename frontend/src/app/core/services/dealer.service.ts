import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { CreateDealerDto, DealerDto, UpdateDealerDto } from '../models/definition.models';

@Injectable({ providedIn: 'root' })
export class DealerService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<DealerDto[]>('/dealers');
  }

  getById(id: number) {
    return this.api.get<DealerDto>(`/dealers/${id}`);
  }

  create(body: CreateDealerDto) {
    return this.api.post<DealerDto>('/dealers', body);
  }

  update(id: number, body: UpdateDealerDto) {
    return this.api.put<DealerDto>(`/dealers/${id}`, body);
  }

  remove(id: number) {
    return this.api.delete<void>(`/dealers/${id}`);
  }
}
