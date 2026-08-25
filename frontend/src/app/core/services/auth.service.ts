/** Giriş/çıkış, token saklama ve currentUser sinyali. */
import { Injectable, Injector, inject, signal } from '@angular/core';
import { Observable, catchError, of, switchMap, tap, throwError } from 'rxjs';
import type { User } from '../models/user.interface';
import {
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  clearStoredSession,
  readStoredRefreshToken,
  readStoredToken,
  storeTokens,
} from '../auth-storage';
import { ApiService } from './api.service';
import { AccessLogService } from './access-log.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
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

  constructor() {
    // Background silent token refresh every 15 minutes while user is authenticated
    setInterval(() => {
      if (this.isAuthenticated() && readStoredRefreshToken()) {
        this.refreshToken().subscribe({ error: () => {} });
      }
    }, 15 * 60 * 1000);
  }

  login(request: LoginRequest, options?: LoginOptions): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', request).pipe(
      tap((res) => {
        this.persistSession(res.token, res.refreshToken, res.user, options?.rememberMe !== false);
        this.currentUser.set(res.user);
      })
    );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = readStoredRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token bulunamadı.'));
    }
    return this.api.post<RefreshTokenResponse>('/auth/refresh-token', { refreshToken }).pipe(
      tap((res) => {
        storeTokens(res.token, res.refreshToken);
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

  /** Profil güncellemesi — API gelene kadar yerel oturumu günceller. */
  updateCurrentUser(updates: Partial<User>): void {
    const current = this.currentUser();
    if (!current) {
      return;
    }
    const next = { ...current, ...updates };
    this.currentUser.set(next);
    this.writeStoredUser(next);
  }

  private clearLocalSession(): void {
    clearStoredSession();
    this.currentUser.set(null);
  }

  private persistSession(token: string, refreshToken: string | undefined, user: User, rememberMe: boolean): void {
    const primary = rememberMe ? localStorage : sessionStorage;
    const secondary = rememberMe ? sessionStorage : localStorage;

    secondary.removeItem(AUTH_TOKEN_KEY);
    secondary.removeItem(AUTH_REFRESH_TOKEN_KEY);
    secondary.removeItem(AUTH_USER_KEY);

    primary.setItem(AUTH_TOKEN_KEY, token);
    if (refreshToken) {
      primary.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
    }
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

  private writeStoredUser(user: User): void {
    const payload = JSON.stringify(user);
    if (localStorage.getItem(AUTH_USER_KEY)) {
      localStorage.setItem(AUTH_USER_KEY, payload);
    }
    if (sessionStorage.getItem(AUTH_USER_KEY)) {
      sessionStorage.setItem(AUTH_USER_KEY, payload);
    }
    if (!localStorage.getItem(AUTH_USER_KEY) && !sessionStorage.getItem(AUTH_USER_KEY)) {
      localStorage.setItem(AUTH_USER_KEY, payload);
    }
  }
}
