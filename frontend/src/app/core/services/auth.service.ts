/** Giriş/çıkış, token saklama ve currentUser sinyali. */
import { Injectable, Injector, inject, signal } from '@angular/core';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import type { User } from '../models/user.interface';
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  clearStoredSession,
  readStoredToken,
} from '../auth-storage';
import { ApiService } from './api.service';
import { AccessLogService } from './access-log.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginOptions {
  /** Hangi portaldan giriş yapıldığı — şu an sadece bilgi amaçlı, backend rolü belirler. */
  portal?: 'bayi' | 'admin';
  /** true → localStorage (sekme kapanınca kalır); false → sessionStorage. */
  rememberMe?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  /** Lazy: AuthService ↔ HttpClient döngüsünü kurulumda tetiklemesin. */
  private readonly injector = inject(Injector);
  readonly currentUser = signal<User | null>(this.readStoredUser());

  login(request: LoginRequest, options?: LoginOptions): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', request).pipe(
      tap((res) => {
        this.persistSession(res.token, res.user, options?.rememberMe !== false);
        this.currentUser.set(res.user);
      })
    );
  }

  /** Önce backend'e çıkış kaydı düşer, sonra yerel oturumu temizler. */
  logout(): Observable<void> {
    const hasToken = !!this.getToken();
    const clear$ = of(void 0).pipe(tap(() => this.clearLocalSession()));

    if (!hasToken) {
      return clear$;
    }

    return this.injector.get(AccessLogService).logLogout().pipe(
      catchError(() => of(void 0)),
      switchMap(() => clear$)
    );
  }

  getToken(): string | null {
    return readStoredToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private clearLocalSession(): void {
    clearStoredSession();
    this.currentUser.set(null);
  }

  private persistSession(token: string, user: User, rememberMe: boolean): void {
    const primary = rememberMe ? localStorage : sessionStorage;
    const secondary = rememberMe ? sessionStorage : localStorage;

    secondary.removeItem(AUTH_TOKEN_KEY);
    secondary.removeItem(AUTH_USER_KEY);
    primary.setItem(AUTH_TOKEN_KEY, token);
    primary.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }

  private readStoredUser(): User | null {
    const raw =
      localStorage.getItem(AUTH_USER_KEY) ?? sessionStorage.getItem(AUTH_USER_KEY);
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
