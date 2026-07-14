/** Giriş/çıkış, token saklama ve currentUser sinyali. Auth API bağlanınca burası doldurulur. */
import { Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import type { User } from '../models/user.interface';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'bayi_portal_token';
  readonly currentUser = signal<User | null>(null);

  login(request: LoginRequest): Observable<LoginResponse> {
    // Placeholder until Auth API is implemented
    const response: LoginResponse = {
      token: 'dev-token',
      user: {
        id: 0,
        name: 'Dev User',
        email: request.email,
        role: 'DealerUser'
      }
    };

    return of(response).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.token);
        this.currentUser.set(res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
