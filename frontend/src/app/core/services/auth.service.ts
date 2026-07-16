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

export interface LoginOptions {
  /** Hangi portal girişi — placeholder rol ataması için (Auth API gelince kalkar). */
  portal?: 'bayi' | 'admin';
  /** true → localStorage (sekme kapanınca kalır); false → sessionStorage. */
  rememberMe?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'bayi_portal_token';
  private readonly userKey = 'bayi_portal_user';
  readonly currentUser = signal<User | null>(this.readStoredUser());

  login(request: LoginRequest, options?: LoginOptions): Observable<LoginResponse> {
    // Placeholder until Auth API is implemented
    const role: User['role'] =
      options?.portal === 'admin' ? 'Admin' : 'DealerUser';

    const response: LoginResponse = {
      token: 'dev-token',
      user: {
        id: 0,
        name: options?.portal === 'admin' ? 'Dev Admin' : 'Dev User',
        email: request.email,
        role,
      },
    };

    return of(response).pipe(
      tap((res) => {
        this.persistSession(res.token, res.user, options?.rememberMe !== false);
        this.currentUser.set(res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey) ?? sessionStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private persistSession(token: string, user: User, rememberMe: boolean): void {
    const primary = rememberMe ? localStorage : sessionStorage;
    const secondary = rememberMe ? sessionStorage : localStorage;

    secondary.removeItem(this.tokenKey);
    secondary.removeItem(this.userKey);
    primary.setItem(this.tokenKey, token);
    primary.setItem(this.userKey, JSON.stringify(user));
  }

  private readStoredUser(): User | null {
    const raw =
      localStorage.getItem(this.userKey) ?? sessionStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
