import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { clearStoredSession, readStoredRefreshToken } from '../auth-storage';
import { AuthService } from '../services/auth.service';

function resolveMessage(error: HttpErrorResponse): string {
  const body = error.error;
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = String((body as { message: string }).message).trim();
    if (msg) {
      return msg;
    }
  }
  if (typeof body === 'string' && body.trim()) {
    return body.trim();
  }

  if (error.status === 401) {
    return 'Oturumunuz geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.';
  }
  if (error.status === 403) {
    return 'Bu işlem için yetkiniz yok.';
  }
  if (error.status === 0) {
    return 'API’ye ulaşılamadı. Backend çalışıyor mu?';
  }

  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/refresh-token');

      if (error.status === 401 && !isAuthEndpoint) {
        const refreshToken = readStoredRefreshToken();
        if (refreshToken) {
          // Automatic seamless background token refresh & request retry
          return authService.refreshToken().pipe(
            switchMap((res) => {
              const retriedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${res.token}`,
                },
              });
              return next(retriedReq);
            }),
            catchError((refreshErr) => {
              clearStoredSession();
              authService.currentUser.set(null);
              const onAdmin = router.url.startsWith('/admin');
              void router.navigateByUrl(onAdmin ? '/admin/login' : '/login');
              return throwError(() => refreshErr);
            })
          );
        }

        clearStoredSession();
        authService.currentUser.set(null);
        const onAdmin = router.url.startsWith('/admin');
        void router.navigateByUrl(onAdmin ? '/admin/login' : '/login');
      }

      return throwError(() => ({
        status: error.status,
        message: resolveMessage(error),
      }));
    })
  );
};
