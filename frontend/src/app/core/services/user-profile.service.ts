/** Giriş yapmış kullanıcının kendi profili (rol farketmez) — backend api/users/me. */
import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { User } from '../models/user.interface';

export interface UpdateOwnProfileRequest {
  name: string;
  email: string;
  phone?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly api = inject(ApiService);

  getMe() {
    return this.api.get<User>('/users/me');
  }

  updateMe(body: UpdateOwnProfileRequest) {
    return this.api.put<User>('/users/me', body);
  }
}
