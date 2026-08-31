import { Routes } from '@angular/router';
import { authGuard, guestGuard, permissionGuard } from './authentication/auth-guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./authentication/login-page').then((component) => component.LoginPage),
    title: 'Sign in | RIS',
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./layout/app-shell').then((component) => component.AppShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard-page').then((component) => component.DashboardPage),
        title: 'Dashboard | RIS',
      },
      {
        path: 'patients',
        canActivate: [permissionGuard('PATIENT_READ')],
        loadComponent: () => import('./patients/patients-page').then((m) => m.PatientsPage),
        title: 'Patients | RIS',
      },
      {
        path: 'patients/:id',
        loadComponent: () =>
          import('./patients/patient-details-page').then((m) => m.PatientDetailsPage),
        title: 'Patient details | RIS',
      },
      {
        path: 'exams',
        canActivate: [permissionGuard('EXAM_READ')],
        loadComponent: () => import('./exams/exams-page').then((component) => component.ExamsPage),
        title: 'Exams | RIS',
      },
      {
        path: 'worklist',
        canActivate: [permissionGuard('WORKLIST_READ')],
        loadComponent: () =>
          import('./worklist/worklist-page').then((component) => component.WorklistPage),
        title: 'Worklist | RIS',
      },
      {
        path: 'reports',
        canActivate: [permissionGuard('REPORT_READ')],
        loadComponent: () =>
          import('./reporting/reports-page').then((component) => component.ReportsPage),
        title: 'Reports | RIS',
      },
      {
        path: 'admin/users',
        canActivate: [permissionGuard('USER_MANAGE')],
        loadComponent: () =>
          import('./administration/users-page').then((component) => component.UsersPage),
        title: 'User administration | RIS',
      },
      {
        path: 'forbidden',
        loadComponent: () =>
          import('./authentication/forbidden-page').then((component) => component.ForbiddenPage),
        title: 'Access restricted | RIS',
      },
      {
        path: '**',
        loadComponent: () =>
          import('./not-found/not-found-page').then((component) => component.NotFoundPage),
        title: 'Page not found | RIS',
      },
    ],
  },
];
