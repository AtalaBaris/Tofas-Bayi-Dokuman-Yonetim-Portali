/** Bayi alanı route'ları (DealerUser). */
import { Routes } from '@angular/router';
import { dealerAuthGuard } from './guards/bayi.guards';

export const BAYI_ROUTES: Routes = [
  {
    path: '',
    canActivate: [dealerAuthGuard],
    loadComponent: () =>
      import('./shell/components/bayi-shell/bayi-shell').then((m) => m.BayiShell),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./home/components/bayi-home-page/bayi-home-page').then((m) => m.BayiHomePage),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./documents/components/bayi-documents-page/bayi-documents-page').then(
            (m) => m.BayiDocumentsPage
          ),
      },
      {
        path: 'documents/:id',
        loadComponent: () =>
          import(
            './documents/components/bayi-document-detail-page/bayi-document-detail-page'
          ).then((m) => m.BayiDocumentDetailPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/components/bayi-profile-page/bayi-profile-page').then(
            (m) => m.BayiProfilePage
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings/components/bayi-settings-page/bayi-settings-page').then(
            (m) => m.BayiSettingsPage
          ),
      },
    ],
  },
];
