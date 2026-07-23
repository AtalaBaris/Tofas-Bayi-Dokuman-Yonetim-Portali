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
    path: '',
    canActivate: [adminAuthGuard, adminRoleGuard(['Admin', 'ContentManager'])],
    loadComponent: () =>
      import('../../shared/components/admin-shell/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/components/admin-dashboard-page/admin-dashboard-page').then(
            (m) => m.AdminDashboardPage
          ),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./shared-docs-list-page/components/docs-list-page/docs-list-page').then(
            (m) => m.DocsListPage
          ),
      },
      {
        path: 'documents/schedule',
        redirectTo: 'documents/pool-calendar',
        pathMatch: 'full',
      },
      {
        path: 'documents/pool-calendar',
        loadComponent: () =>
          import(
            './shared-docs-list-page/components/docs-pool-calendar-page/docs-pool-calendar-page'
          ).then((m) => m.DocsPoolCalendarPage),
      },
      {
        path: 'documents/new',
        loadComponent: () =>
          import('./add-document/components/add-document-page/add-document-page').then(
            (m) => m.AddDocumentPage
          ),
      },
      {
        path: 'documents/:id/edit',
        loadComponent: () =>
          import('./edit-document/components/edit-document-page/edit-document-page').then(
            (m) => m.EditDocumentPage
          ),
      },
      {
        path: 'documents/:id/access-report',
        loadComponent: () =>
          import(
            './document-access-report/components/document-access-report-page/document-access-report-page'
          ).then((m) => m.DocumentAccessReportPage),
      },
      {
        path: 'login-activity',
        canActivate: [adminRoleGuard(['Admin'])],
        loadComponent: () =>
          import('./login-activity/components/login-activity-page/login-activity-page').then(
            (m) => m.LoginActivityPage
          ),
      },
      {
        path: 'access-logs',
        canActivate: [adminRoleGuard(['Admin', 'ContentManager'])],
        loadComponent: () =>
          import('./access-logs/access-logs').then((m) => m.AccessLogs),
      },
      {
        path: 'definitions',
        canActivate: [adminRoleGuard(['Admin'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'users' },
          {
            path: ':section',
            loadComponent: () =>
              import(
                './definition-management/components/definition-management-page/definition-management-page'
              ).then((m) => m.DefinitionManagementPage),
          },
        ],
      },
      {
        path: 'materials/new',
        redirectTo: 'documents/new',
        pathMatch: 'full',
      },
    ],
  },
];
