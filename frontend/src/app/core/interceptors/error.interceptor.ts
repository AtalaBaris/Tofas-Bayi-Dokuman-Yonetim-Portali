/** API hatalarını yakalar; teknik detay yerine kullanıcıya anlaşılır mesaj taşır. */
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { clearStoredSession } from '../auth-storage';
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

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/auth/login');

      if (error.status === 401 && !isLoginRequest) {
        // Geçersiz JWT: yerel oturumu temizle (logout API çağrısı yapmadan).
        clearStoredSession();
        try {
          inject(AuthService).currentUser.set(null);
        } catch {
          /* DI henüz hazır değilse storage temizliği yeterli */
        }

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
