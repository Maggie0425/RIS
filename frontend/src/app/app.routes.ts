import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'patients' },
  {
    path: 'patients',
    loadComponent: () => import('./patients/patients-page').then((m) => m.PatientsPage),
    title: 'Patients | RIS',
  },
  { path: '**', redirectTo: 'patients' },
];
