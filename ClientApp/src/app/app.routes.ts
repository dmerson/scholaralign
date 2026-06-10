import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'scholarships',
    loadComponent: () => import('./features/scholarships/scholarships').then(m => m.ScholarshipsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'scholarships/:id',
    loadComponent: () => import('./features/scholarships/scholarship-detail').then(m => m.ScholarshipDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'applications',
    loadComponent: () => import('./features/applications/application-list').then(m => m.ApplicationListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'applications/:id',
    loadComponent: () => import('./features/applications/application-detail').then(m => m.ApplicationDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reviewer',
    loadComponent: () => import('./features/reviewer/reviewer-scholarships').then(m => m.ReviewerScholarshipsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reviewer/:scholarshipId',
    loadComponent: () => import('./features/reviewer/reviewer-applicants').then(m => m.ReviewerApplicantsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reviewer/:scholarshipId/:applicationId',
    loadComponent: () => import('./features/reviewer/reviewer-form').then(m => m.ReviewerFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'org-admin',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'award-years', pathMatch: 'full' },
      {
        path: 'award-years',
        loadComponent: () => import('./features/org-admin/award-years/award-years').then(m => m.AwardYearsComponent)
      },
      {
        path: 'users-roles',
        loadComponent: () => import('./features/org-admin/users-roles/users-roles').then(m => m.UsersRolesComponent)
      },
      {
        path: 'hierarchy',
        loadComponent: () => import('./features/org-admin/hierarchy/hierarchy').then(m => m.HierarchyComponent)
      },
      {
        path: 'committees',
        loadComponent: () => import('./features/org-admin/committees/committees').then(m => m.CommitteesComponent)
      },
      {
        path: 'scholarships',
        loadComponent: () => import('./features/org-admin/scholarships/scholarships').then(m => m.OrgScholarshipsComponent)
      },
      {
        path: 'scholarships/:id/requirements',
        loadComponent: () => import('./features/org-admin/requirements/requirements').then(m => m.RequirementsComponent)
      },
      {
        path: 'award-scholarships',
        loadComponent: () => import('./features/org-admin/award-scholarships/award-scholarships').then(m => m.AwardScholarshipsComponent)
      }
    ]
  },
  {
    path: 'public-admin',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'questions', pathMatch: 'full' },
      {
        path: 'organizations',
        loadComponent: () => import('./features/public-admin/organizations/organizations').then(m => m.OrganizationsComponent)
      },
      {
        path: 'suborganizations',
        loadComponent: () => import('./features/public-admin/suborganizations/suborganizations').then(m => m.SubOrganizationsComponent)
      },
      {
        path: 'questions',
        loadComponent: () => import('./features/public-admin/questions/questions').then(m => m.QuestionsComponent)
      },
      {
        path: 'award-years',
        loadComponent: () => import('./features/public-admin/award-years/award-years').then(m => m.PublicAwardYearsComponent)
      },
      {
        path: 'scholarships',
        loadComponent: () => import('./features/public-admin/scholarships/scholarships').then(m => m.PublicScholarshipsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
