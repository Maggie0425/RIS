import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { startWith } from 'rxjs';
import { AuthSession } from '../authentication/auth-session';
import { Patient, PatientSex, patientDisplayName, patientSexLabel } from './patient';
import { PatientApi } from './patient-api';
import { PatientFormDialog } from './patient-form-dialog';

@Component({
  selector: 'app-patients-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <header>
      <div>
        <h1>Patients</h1>
        <p>Register, view, and update synthetic patient records, then create an examination order.</p>
      </div>
      @if (canWrite()) {
        <button mat-flat-button type="button" (click)="openForm()">
          <mat-icon svgIcon="person_add"></mat-icon>
          Register patient
        </button>
      }
    </header>
    @if (error()) {
      <mat-card appearance="outlined" class="error-card" role="alert">
        <mat-card-content>
          {{ error() }}
          <button mat-button type="button" (click)="load()">Try again</button>
        </mat-card-content>
      </mat-card>
    }
    @if (loading()) {
      <div class="state">
        <mat-spinner diameter="42" />
        <p>Loading patients…</p>
      </div>
    } @else if (!error() && patients().length === 0) {
      <mat-card appearance="outlined" class="state">
        <mat-card-content>
          <mat-icon class="empty-icon" svgIcon="group"></mat-icon>
          <h2>No patients yet</h2>
          <p>Register the first synthetic patient to begin an exam order.</p>
          @if (canWrite()) {
            <button mat-flat-button type="button" (click)="openForm()">Register patient</button>
          }
        </mat-card-content>
      </mat-card>
    } @else if (patients().length > 0) {
      <mat-form-field appearance="outline" class="search">
        <mat-label>Search patients</mat-label>
        <input matInput [formControl]="search" placeholder="Name or MRN" />
        <mat-icon matSuffix svgIcon="search"></mat-icon>
      </mat-form-field>
      <mat-card appearance="outlined" class="table-card">
        <div class="table-scroll">
          <table mat-table [dataSource]="filteredPatients()">
            <ng-container matColumnDef="medicalRecordNumber">
              <th mat-header-cell *matHeaderCellDef>MRN</th>
              <td mat-cell *matCellDef="let patient">
                <strong>{{ patient.medicalRecordNumber }}</strong>
              </td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let patient">{{ displayName(patient) }}</td>
            </ng-container>
            <ng-container matColumnDef="dateOfBirth">
              <th mat-header-cell *matHeaderCellDef>Date of birth</th>
              <td mat-cell *matCellDef="let patient">
                {{ patient.dateOfBirth | date: 'dd MMM yyyy' : 'UTC' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="sex">
              <th mat-header-cell *matHeaderCellDef>Sex</th>
              <td mat-cell *matCellDef="let patient">{{ sexLabel(patient.sex) }}</td>
            </ng-container>
            <ng-container matColumnDef="updatedAt">
              <th mat-header-cell *matHeaderCellDef>Updated</th>
              <td mat-cell *matCellDef="let patient">
                {{ patient.updatedAt | date: 'dd MMM yyyy, HH:mm' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>
                <span class="visually-hidden">Actions</span>
              </th>
              <td mat-cell *matCellDef="let patient" class="actions">
                <a
                  mat-icon-button
                  matTooltip="View patient"
                  [routerLink]="['/patients', patient.id]"
                  [attr.aria-label]="'View ' + displayName(patient)"
                  (click)="$event.stopPropagation()"
                >
                  <mat-icon svgIcon="visibility"></mat-icon>
                </a>
                <button
                  mat-icon-button
                  type="button"
                  matTooltip="Edit patient"
                  [attr.aria-label]="'Edit ' + displayName(patient)"
                  (click)="openForm(patient, $event)"
                >
                  <mat-icon svgIcon="edit"></mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns()"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: columns()"
              class="clickable-row"
              (click)="openDetails(row)"
            ></tr>
          </table>
        </div>
      </mat-card>
      @if (filteredPatients().length === 0) {
        <p class="no-matches">No patients match that search.</p>
      }
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
      .search {
        width: min(28rem, 100%);
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
      .clickable-row {
        cursor: pointer;
      }
      .clickable-row:hover {
        background: rgb(21 101 192 / 6%);
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
      .no-matches {
        color: var(--ris-text-secondary);
        margin-top: 1rem;
      }
      .visually-hidden {
        clip: rect(0 0 0 0);
        height: 1px;
        margin: -1px;
        overflow: hidden;
        padding: 0;
        position: absolute;
        width: 1px;
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
  private readonly session = inject(AuthSession);
  private readonly router = inject(Router);
  readonly patients = signal<Patient[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly canWrite = computed(() => this.session.hasPermission('PATIENT_WRITE'));
  readonly columns = computed(() => [
    'medicalRecordNumber',
    'name',
    'dateOfBirth',
    'sex',
    'updatedAt',
    ...(this.canWrite() ? ['actions'] : []),
  ]);
  readonly search = new FormControl('', { nonNullable: true });
  private readonly searchValue = toSignal(this.search.valueChanges.pipe(startWith('')), {
    initialValue: '',
  });
  readonly filteredPatients = computed(() => {
    const query = this.searchValue().trim().toLowerCase();
    if (!query) {
      return this.patients();
    }
    return this.patients().filter((patient) => {
      const haystack = `${patient.medicalRecordNumber} ${patient.firstName} ${patient.lastName}`.toLowerCase();
      return haystack.includes(query);
    });
  });
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

  openDetails(patient: Patient): void {
    void this.router.navigate(['/patients', patient.id]);
  }

  openForm(patient: Patient | null = null, event?: Event): void {
    event?.stopPropagation();
    if (!this.canWrite()) return;
    this.dialog
      .open(PatientFormDialog, {
        data: patient,
        width: '620px',
        maxWidth: '95vw',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((saved: Patient | undefined) => {
        if (saved) {
          this.load();
        }
      });
  }

  displayName = patientDisplayName;

  sexLabel(sex: PatientSex): string {
    return patientSexLabel(sex);
  }
}
