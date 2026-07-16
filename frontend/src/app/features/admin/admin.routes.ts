/** /admin altındaki public (login) ve private (yönetim) route'ları. */
import { Routes } from '@angular/router';
import { adminAuthGuard, adminRoleGuard } from './guards/admin.guards';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/components/admin-login/admin-login').then((m) => m.AdminLogin),
  },
  {
    path: 'access-logs',
    canActivate: [adminAuthGuard, adminRoleGuard(['Admin'])],
    loadComponent: () =>
      import('./access-logs/access-logs').then((m) => m.AccessLogs),
  },
  {
    path: 'materials/new',
    canActivate: [adminAuthGuard, adminRoleGuard(['Admin', 'ContentManager'])],
    loadComponent: () =>
      import('../materials/material-form/material-form').then((m) => m.MaterialForm),
  },
];
