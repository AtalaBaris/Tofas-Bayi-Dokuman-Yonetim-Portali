import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { CreateUserDto, UpdateUserDto, UserDto } from '../models/definition.models';

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<UserDto[]>('/users');
  }

  getById(id: number) {
    return this.api.get<UserDto>(`/users/${id}`);
  }

  create(body: CreateUserDto) {
    return this.api.post<UserDto>('/users', body);
  }

  update(id: number, body: UpdateUserDto) {
    return this.api.put<UserDto>(`/users/${id}`, body);
  }

  remove(id: number) {
    return this.api.delete<void>(`/users/${id}`);
  }
}
