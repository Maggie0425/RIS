import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./authentication/login-page').then((component) => component.LoginPage),
    title: 'Sign in | RIS',
  },
  {
    path: '',
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
        loadComponent: () => import('./exams/exams-page').then((component) => component.ExamsPage),
        title: 'Exams | RIS',
      },
      {
        path: 'worklist',
        loadComponent: () =>
          import('./worklist/worklist-page').then((component) => component.WorklistPage),
        title: 'Worklist | RIS',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./reporting/reports-page').then((component) => component.ReportsPage),
        title: 'Reports | RIS',
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./administration/users-page').then((component) => component.UsersPage),
        title: 'User administration | RIS',
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
