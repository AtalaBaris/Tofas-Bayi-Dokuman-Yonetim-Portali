/** API hatalarını yakalar; teknik detay yerine kullanıcıya anlaşılır mesaj taşır. */
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        (error.error && typeof error.error === 'object' && 'message' in error.error
          ? String((error.error as { message: string }).message)
          : null) ||
        'Bir hata oluştu. Lütfen tekrar deneyin.';

      return throwError(() => ({ status: error.status, message }));
    })
  );
};
