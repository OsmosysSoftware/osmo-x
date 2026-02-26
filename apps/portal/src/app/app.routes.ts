import { Routes } from '@angular/router';
import { AppLayout } from './layout/component/app.layout';
import { Notfound } from './pages/notfound/notfound';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },

      // Notification Routes
      // {
      //   path: 'notifications',
      //   loadComponent: () =>
      //     import('./features/notifications/pages/notifications-list/notifications-list').then(
      //       (m) => m.NotificationsListComponent,
      //     ),
      // },
      // {
      //   path: 'archived-notifications',
      //   loadComponent: () =>
      //     import(
      //       './features/archived-notifications/pages/archived-list/archived-list'
      //     ).then((m) => m.ArchivedListComponent),
      // },

      // Configuration Routes
      // {
      //   path: 'applications',
      //   loadComponent: () =>
      //     import('./features/applications/pages/applications-list/applications-list').then(
      //       (m) => m.ApplicationsListComponent,
      //     ),
      // },
      // {
      //   path: 'providers',
      //   loadComponent: () =>
      //     import('./features/providers/pages/providers-list/providers-list').then(
      //       (m) => m.ProvidersListComponent,
      //     ),
      // },
      // {
      //   path: 'provider-chains',
      //   loadComponent: () =>
      //     import('./features/provider-chains/pages/chains-list/chains-list').then(
      //       (m) => m.ChainsListComponent,
      //     ),
      // },
      // {
      //   path: 'webhooks',
      //   loadComponent: () =>
      //     import('./features/webhooks/pages/webhooks-list/webhooks-list').then(
      //       (m) => m.WebhooksListComponent,
      //     ),
      // },
      // {
      //   path: 'api-keys',
      //   loadComponent: () =>
      //     import('./features/api-keys/pages/api-keys-list/api-keys-list').then(
      //       (m) => m.ApiKeysListComponent,
      //     ),
      // },

      // Administration Routes
      // {
      //   path: 'users',
      //   loadComponent: () =>
      //     import('./features/users/pages/users-list/users-list').then(
      //       (m) => m.UsersListComponent,
      //     ),
      // },
    ],
  },
  { path: 'auth', loadChildren: () => import('./pages/auth/auth.routes') },
  { path: 'notfound', component: Notfound },
  { path: '**', redirectTo: '/notfound' },
];
