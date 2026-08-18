import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialog } from './confirm-dialog';
import { Patient, PatientSex } from './patient';
import { PatientApi } from './patient-api';
import { PatientFormDialog } from './patient-form-dialog';

@Component({
  selector: 'app-patients-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <header>
      <div>
        <h1>Patients</h1>
        <p>Register and manage synthetic patient records.</p>
      </div>
      <button mat-flat-button (click)="openForm()">
        <mat-icon>person_add</mat-icon>Register patient
      </button>
    </header>
    @if (error()) {
      <mat-card appearance="outlined" class="error-card" role="alert"
        ><mat-card-content
          >{{ error() }} <button mat-button (click)="load()">Try again</button></mat-card-content
        ></mat-card
      >
    }
    @if (loading()) {
      <div class="state">
        <mat-spinner diameter="42" />
        <p>Loading patients…</p>
      </div>
    } @else if (!error() && patients().length === 0) {
      <mat-card appearance="outlined" class="state"
        ><mat-card-content
          ><mat-icon class="empty-icon">group</mat-icon>
          <h2>No patients yet</h2>
          <p>Register the first synthetic patient to begin an exam order.</p>
          <button mat-flat-button (click)="openForm()">Register patient</button></mat-card-content
        ></mat-card
      >
    } @else if (patients().length > 0) {
      <mat-card appearance="outlined" class="table-card"
        ><div class="table-scroll">
          <table mat-table [dataSource]="patients()">
            <ng-container matColumnDef="medicalRecordNumber"
              ><th mat-header-cell *matHeaderCellDef>MRN</th>
              <td mat-cell *matCellDef="let patient">
                <strong>{{ patient.medicalRecordNumber }}</strong>
              </td></ng-container
            >
            <ng-container matColumnDef="name"
              ><th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let patient">
                {{ patient.lastName }}, {{ patient.firstName }}
              </td></ng-container
            >
            <ng-container matColumnDef="dateOfBirth"
              ><th mat-header-cell *matHeaderCellDef>Date of birth</th>
              <td mat-cell *matCellDef="let patient">
                {{ patient.dateOfBirth | date: 'dd MMM yyyy' : 'UTC' }}
              </td></ng-container
            >
            <ng-container matColumnDef="sex"
              ><th mat-header-cell *matHeaderCellDef>Sex</th>
              <td mat-cell *matCellDef="let patient">{{ sexLabel(patient.sex) }}</td></ng-container
            >
            <ng-container matColumnDef="updatedAt"
              ><th mat-header-cell *matHeaderCellDef>Updated</th>
              <td mat-cell *matCellDef="let patient">
                {{ patient.updatedAt | date: 'dd MMM yyyy, HH:mm' }}
              </td></ng-container
            >
            <ng-container matColumnDef="actions"
              ><th mat-header-cell *matHeaderCellDef>
                <span class="visually-hidden">Actions</span>
              </th>
              <td mat-cell *matCellDef="let patient" class="actions">
                <button
                  mat-icon-button
                  matTooltip="Edit patient"
                  [attr.aria-label]="'Edit ' + patient.firstName + ' ' + patient.lastName"
                  (click)="openForm(patient)"
                >
                  <mat-icon>edit</mat-icon></button
                ><button
                  mat-icon-button
                  matTooltip="Delete patient"
                  [attr.aria-label]="'Delete ' + patient.firstName + ' ' + patient.lastName"
                  (click)="confirmDelete(patient)"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </td></ng-container
            >
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table></div
      ></mat-card>
    }
  `,
  styles: [
    `
      header {
        align-items: start;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0 0 0.25rem;
      }
      header p {
        color: var(--mat-sys-on-surface-variant);
        margin: 0;
      }
      .table-card {
        overflow: hidden;
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        min-width: 820px;
        width: 100%;
      }
      .actions {
        text-align: right;
        white-space: nowrap;
      }
      .state {
        align-items: center;
        display: flex;
        flex-direction: column;
        padding: 4rem 1rem;
        text-align: center;
      }
      .state h2 {
        margin-bottom: 0;
      }
      .state p {
        color: var(--mat-sys-on-surface-variant);
      }
      .empty-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
      }
      .error-card {
        border-color: var(--mat-sys-error);
        color: var(--mat-sys-error);
        margin-bottom: 1rem;
      }
      .visually-hidden {
        height: 1px;
        margin: -1px;
        overflow: hidden;
        padding: 0;
        position: absolute;
        width: 1px;
        clip: rect(0 0 0 0);
      }
      @media (max-width: 600px) {
        header {
          align-items: stretch;
          flex-direction: column;
        }
        header button {
          align-self: start;
        }
      }
    `,
  ],
})
export class PatientsPage {
  private readonly api = inject(PatientApi);
  private readonly dialog = inject(MatDialog);
  readonly patients = signal<Patient[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly columns = ['medicalRecordNumber', 'name', 'dateOfBirth', 'sex', 'updatedAt', 'actions'];
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (patients) => {
        this.patients.set(patients);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Patients could not be loaded. Check that the backend is running.');
        this.loading.set(false);
      },
    });
  }
  openForm(patient: Patient | null = null): void {
    this.dialog
      .open(PatientFormDialog, {
        data: patient,
        width: '620px',
        maxWidth: '95vw',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) this.load();
      });
  }
  confirmDelete(patient: Patient): void {
    this.dialog
      .open(ConfirmDialog, { data: `${patient.firstName} ${patient.lastName}`, width: '420px' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.delete(patient);
      });
  }
  sexLabel(sex: PatientSex): string {
    return ({ FEMALE: 'Female', MALE: 'Male', OTHER: 'Other', UNKNOWN: 'Unknown' } as const)[sex];
  }
  private delete(patient: Patient): void {
    this.api
      .delete(patient.id)
      .subscribe({
        next: () => this.load(),
        error: (response: HttpErrorResponse) =>
          this.error.set(response.error?.message ?? 'Patient could not be deleted.'),
      });
  }
}
