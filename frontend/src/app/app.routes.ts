/** URL yolları, lazy-load component'ler ve guard'lar burada tanımlanır. */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login)
  },
  {
    path: 'materials',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/materials/material-list/material-list').then((m) => m.MaterialList)
  },
  {
    path: 'materials/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/materials/material-detail/material-detail').then((m) => m.MaterialDetail)
  },
  {
    path: 'admin/materials/new',
    canActivate: [authGuard, roleGuard(['Admin', 'ContentManager'])],
    loadComponent: () =>
      import('./features/materials/material-form/material-form').then((m) => m.MaterialForm)
  },
  {
    path: 'admin/access-logs',
    canActivate: [authGuard, roleGuard(['Admin'])],
    loadComponent: () =>
      import('./features/admin/access-logs/access-logs').then((m) => m.AccessLogs)
  },
  { path: '**', redirectTo: 'login' }
];
