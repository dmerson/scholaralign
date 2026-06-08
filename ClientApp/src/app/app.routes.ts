import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'scholarships',
    loadComponent: () =>
      import('./features/scholarships/scholarship-list/scholarship-list').then(m => m.ScholarshipListComponent)
  },
  {
    path: 'scholarships/:id',
    loadComponent: () =>
      import('./features/scholarships/scholarship-detail/scholarship-detail').then(m => m.ScholarshipDetailComponent)
  },
  {
    path: 'apply/:scholarshipId',
    loadComponent: () => import('./features/apply/apply').then(m => m.ApplyComponent),
    canActivate: [authGuard]
  },
  {
    path: 'my-applications',
    loadComponent: () =>
      import('./features/my-applications/my-applications').then(m => m.MyApplicationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'scholarships',
        loadComponent: () =>
          import('./features/admin/manage-scholarships/manage-scholarships').then(m => m.ManageScholarshipsComponent)
      },
      {
        path: 'applications',
        loadComponent: () =>
          import('./features/admin/manage-applications/manage-applications').then(m => m.ManageApplicationsComponent)
      },
      {
        path: 'organizations',
        loadComponent: () =>
          import('./features/admin/manage-organizations/manage-organizations').then(m => m.ManageOrganizationsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
