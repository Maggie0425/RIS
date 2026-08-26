import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Exam, examStatusLabel } from './exam';
import { ExamApi } from './exam-api';

@Component({
  selector: 'app-exams-page',
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
    <header>
      <div>
        <h1>Exams</h1>
        <p>Track imaging exam orders. Create a new order from a patient record.</p>
      </div>
      <a mat-stroked-button routerLink="/patients">
        <mat-icon>group</mat-icon>
        Open patients
      </a>
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
        <p>Loading exams…</p>
      </div>
    } @else if (!error() && exams().length === 0) {
      <mat-card appearance="outlined" class="state">
        <mat-card-content>
          <h2>No exam orders yet</h2>
          <p>Open a patient and use Create order. New exams start in ORDERED status.</p>
          <a mat-flat-button routerLink="/patients">Go to patients</a>
        </mat-card-content>
      </mat-card>
    } @else if (exams().length > 0) {
      <mat-card appearance="outlined">
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
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let exam">{{ exam.createdAt | date: 'dd MMM yyyy, HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="patient">
              <th mat-header-cell *matHeaderCellDef>Patient</th>
              <td mat-cell *matCellDef="let exam">
                <a [routerLink]="['/patients', exam.patientId]">View patient</a>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </div>
      </mat-card>
    }
  `,
  styles: [
    `
      header {
        align-items: start;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        margin-bottom: 1.5rem;
      }
      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0 0 0.25rem;
      }
      header p {
        color: var(--ris-text-secondary);
        margin: 0;
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        min-width: 760px;
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
      .error-card {
        border-color: var(--mat-sys-error);
        color: var(--mat-sys-error);
        margin-bottom: 1rem;
      }
      a {
        color: var(--mat-sys-primary);
      }
    `,
  ],
})
export class ExamsPage {
  private readonly api = inject(ExamApi);
  readonly exams = signal<Exam[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly columns = ['accessionNumber', 'requestedProcedure', 'modality', 'status', 'createdAt', 'patient'];
  readonly statusLabel = examStatusLabel;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (exams) => {
        this.exams.set(exams);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Exams could not be loaded. Check that the backend is running.');
        this.loading.set(false);
      },
    });
  }
}
