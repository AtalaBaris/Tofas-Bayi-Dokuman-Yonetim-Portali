/** URL yolları, lazy-load component'ler ve guard'lar burada tanımlanır. */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/bayi/login/components/bayi-login/bayi-login').then((m) => m.BayiLogin),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'materials',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/materials/material-list/material-list').then((m) => m.MaterialList),
  },
  {
    path: 'materials/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/materials/material-detail/material-detail').then((m) => m.MaterialDetail),
  },
  { path: '**', redirectTo: 'login' },
];
