import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { map, switchMap } from 'rxjs';
import { ExamOrderDialog } from '../exams/exam-order-dialog';
import { Exam, examStatusLabel } from '../exams/exam';
import { ExamApi } from '../exams/exam-api';
import { Patient, patientDisplayName, patientSexLabel } from './patient';
import { PatientApi } from './patient-api';
import { PatientFormDialog } from './patient-form-dialog';

@Component({
  selector: 'app-patient-details-page',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  template: `
    <a class="back" routerLink="/patients">
      <mat-icon svgIcon="chevron_left"></mat-icon>
      Patients
    </a>
    @if (loading()) {
      <div class="state">
        <mat-spinner diameter="42" />
        <p>Loading patient…</p>
      </div>
    } @else if (error()) {
      <mat-card appearance="outlined" class="error-card" role="alert">
        <mat-card-content>
          {{ error() }}
          <a mat-button routerLink="/patients">Back to patients</a>
        </mat-card-content>
      </mat-card>
    } @else if (patient(); as current) {
      <header>
        <div>
          <p class="eyebrow">Patient record</p>
          <h1>{{ displayName(current) }}</h1>
          <p>MRN {{ current.medicalRecordNumber }} · synthetic data only</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button type="button" (click)="openEdit(current)">
            <mat-icon svgIcon="edit"></mat-icon>
            Edit patient
          </button>
          <button mat-flat-button type="button" (click)="openOrder(current)">
            <mat-icon svgIcon="add"></mat-icon>
            Create order
          </button>
        </div>
      </header>

      <section class="details-grid">
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Demographics</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <dl>
              <div>
                <dt>Medical record number</dt>
                <dd>{{ current.medicalRecordNumber }}</dd>
              </div>
              <div>
                <dt>First name</dt>
                <dd>{{ current.firstName }}</dd>
              </div>
              <div>
                <dt>Last name</dt>
                <dd>{{ current.lastName }}</dd>
              </div>
              <div>
                <dt>Date of birth</dt>
                <dd>{{ current.dateOfBirth | date: 'dd MMM yyyy' : 'UTC' }}</dd>
              </div>
              <div>
                <dt>Sex</dt>
                <dd>{{ sexLabel(current.sex) }}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{{ current.updatedAt | date: 'dd MMM yyyy, HH:mm' }}</dd>
              </div>
            </dl>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined" class="orders-card">
          <mat-card-header>
            <mat-card-title>Examination orders</mat-card-title>
            <mat-card-subtitle>New orders are created in ORDERED status before scheduling.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (examsLoading()) {
              <div class="state compact">
                <mat-spinner diameter="32" />
                <p>Loading orders…</p>
              </div>
            } @else if (examsError()) {
              <p class="inline-error" role="alert">
                {{ examsError() }}
                <button mat-button type="button" (click)="loadExams(current.id)">Try again</button>
              </p>
            } @else if (exams().length === 0) {
              <div class="empty-orders">
                <mat-icon svgIcon="assignment"></mat-icon>
                <p>No examination orders yet.</p>
                <button mat-flat-button type="button" (click)="openOrder(current)">Create order</button>
              </div>
            } @else {
              <div class="table-scroll">
                <table mat-table [dataSource]="exams()">
                  <ng-container matColumnDef="accessionNumber">
                    <th mat-header-cell *matHeaderCellDef>Accession</th>
                    <td mat-cell *matCellDef="let exam">
                      <strong>{{ exam.accessionNumber }}</strong>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="requestedProcedure">
                    <th mat-header-cell *matHeaderCellDef>Procedure</th>
                    <td mat-cell *matCellDef="let exam">{{ exam.requestedProcedure }}</td>
                  </ng-container>
                  <ng-container matColumnDef="modality">
                    <th mat-header-cell *matHeaderCellDef>Modality</th>
                    <td mat-cell *matCellDef="let exam">{{ exam.modality }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let exam">
                      <span class="status" [attr.data-status]="exam.status">{{ statusLabel(exam.status) }}</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="createdAt">
                    <th mat-header-cell *matHeaderCellDef>Ordered</th>
                    <td mat-cell *matCellDef="let exam">{{ exam.createdAt | date: 'dd MMM yyyy, HH:mm' }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="examColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: examColumns"></tr>
                </table>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </section>
    }
  `,
  styles: [
    `
      .back {
        align-items: center;
        color: var(--mat-sys-primary);
        display: inline-flex;
        font-weight: 600;
        gap: 0.25rem;
        margin-bottom: 1rem;
        text-decoration: none;
      }
      header {
        align-items: start;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        margin-bottom: 1.5rem;
      }
      .eyebrow {
        color: var(--mat-sys-primary);
        font: var(--mat-sys-label-large);
        letter-spacing: 0.04em;
        margin: 0 0 0.35rem;
        text-transform: uppercase;
      }
      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0 0 0.25rem;
      }
      header p:last-child {
        color: var(--ris-text-secondary);
        margin: 0;
      }
      .header-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .details-grid {
        display: grid;
        gap: 1.25rem;
        grid-template-columns: minmax(16rem, 22rem) minmax(0, 1fr);
      }
      dl {
        display: grid;
        gap: 0.85rem 1rem;
        grid-template-columns: 1fr 1fr;
        margin: 1rem 0 0;
      }
      dt {
        color: var(--ris-text-secondary);
        font-size: 0.8rem;
      }
      dd {
        margin: 0.15rem 0 0;
      }
      .orders-card {
        min-width: 0;
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        min-width: 640px;
        width: 100%;
      }
      .status {
        background: #e8f0fe;
        border-radius: 999px;
        color: #1565c0;
        display: inline-block;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.2rem 0.65rem;
      }
      .status[data-status='CANCELLED'] {
        background: #fdecea;
        color: var(--mat-sys-error);
      }
      .status[data-status='COMPLETED'] {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .state {
        align-items: center;
        display: flex;
        flex-direction: column;
        padding: 4rem 1rem;
        text-align: center;
      }
      .state.compact {
        padding: 2rem 1rem;
      }
      .empty-orders {
        align-items: center;
        color: var(--ris-text-secondary);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1.5rem 0;
        text-align: center;
      }
      .error-card,
      .inline-error {
        color: var(--mat-sys-error);
      }
      .error-card {
        border-color: var(--mat-sys-error);
      }
      @media (max-width: 959px) {
        .details-grid,
        dl {
          grid-template-columns: 1fr;
        }
        header {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class PatientDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly patientsApi = inject(PatientApi);
  private readonly examsApi = inject(ExamApi);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly patient = signal<Patient | null>(null);
  readonly exams = signal<Exam[]>([]);
  readonly loading = signal(true);
  readonly examsLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly examsError = signal<string | null>(null);
  readonly examColumns = ['accessionNumber', 'requestedProcedure', 'modality', 'status', 'createdAt'];
  readonly displayName = patientDisplayName;
  readonly sexLabel = patientSexLabel;
  readonly statusLabel = examStatusLabel;

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        switchMap((id) => {
          this.loading.set(true);
          this.error.set(null);
          this.patient.set(null);
          return this.patientsApi.get(id);
        }),
      )
      .subscribe({
        next: (patient) => {
          this.patient.set(patient);
          this.loading.set(false);
          this.loadExams(patient.id);
        },
        error: (response: HttpErrorResponse) => {
          this.loading.set(false);
          this.examsLoading.set(false);
          this.error.set(
            response.status === 404
              ? 'That patient was not found.'
              : 'Patient details could not be loaded. Check that the backend is running.',
          );
        },
      });
  }

  loadExams(patientId: number): void {
    this.examsLoading.set(true);
    this.examsError.set(null);
    this.examsApi.list({ patientId }).subscribe({
      next: (exams) => {
        this.exams.set(exams);
        this.examsLoading.set(false);
      },
      error: () => {
        this.examsError.set('Examination orders could not be loaded.');
        this.examsLoading.set(false);
      },
    });
  }

  openEdit(patient: Patient): void {
    this.dialog
      .open(PatientFormDialog, { data: patient, width: '620px', maxWidth: '95vw', disableClose: true })
      .afterClosed()
      .subscribe((saved: Patient | undefined) => {
        if (saved) {
          this.patient.set(saved);
        }
      });
  }

  openOrder(patient: Patient): void {
    this.dialog
      .open(ExamOrderDialog, { data: { patient }, width: '560px', maxWidth: '95vw', disableClose: true })
      .afterClosed()
      .subscribe((exam: Exam | undefined) => {
        if (!exam) {
          return;
        }
        this.loadExams(patient.id);
        this.snackBar.open(`Order ${exam.accessionNumber} created in ${this.statusLabel(exam.status)} status.`, 'Dismiss', {
          duration: 5000,
        });
      });
  }
}
