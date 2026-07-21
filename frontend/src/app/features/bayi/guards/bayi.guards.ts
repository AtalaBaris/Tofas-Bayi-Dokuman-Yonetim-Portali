/**
 * Bayi alanı guard'ı. Oturum yoksa /login; Admin/ContentManager kendi paneline (/admin)
 * yönlendirilir — asıl güvenlik zaten backend'de (her istek RequestingUser.Role'e göre yetkilendirilir).
 */
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

export const dealerAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (auth.currentUser()?.role === 'DealerUser') {
    return true;
  }

  return router.createUrlTree(['/admin']);
};
