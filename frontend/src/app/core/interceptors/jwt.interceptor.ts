/** Her HTTP isteğine Authorization: Bearer <token> ekler. */
import { HttpInterceptorFn } from '@angular/common/http';
import { readStoredToken } from '../auth-storage';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // AuthService inject etme — HttpClient ↔ AuthService döngüsel bağımlılığını önler.
  const token = readStoredToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
  );
};
