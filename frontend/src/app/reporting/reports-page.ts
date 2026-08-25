import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReportActionDialog } from './report-action-dialog';
import {
  ReportViewFilter,
  ReportingExamStatus,
  ReportingExamView,
  reportingModalityLabel,
  reportingPatientName,
} from './report';
import { ReportsApi } from './reports-api';

@Component({
  selector: 'app-reports-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
})
export class ReportsPage {
  private readonly api = inject(ReportsApi);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly exams = signal<ReportingExamView[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedExamId = signal<number | null>(null);
  readonly viewFilter = signal<ReportViewFilter>('NEEDS_REPORT');
  readonly searchTerm = signal('');

  readonly reportForm = new FormGroup({
    reportText: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
  });

  readonly needsReportCount = computed(
    () => this.exams().filter((exam) => exam.status === 'ACQUIRED').length,
  );
  readonly submittedCount = computed(
    () => this.exams().filter((exam) => exam.status === 'REPORTED').length,
  );
  readonly completedCount = computed(
    () => this.exams().filter((exam) => exam.status === 'COMPLETED').length,
  );

  readonly filteredExams = computed(() => {
    const status = this.statusForFilter(this.viewFilter());
    const query = this.searchTerm().trim().toLowerCase();
    return this.exams()
      .filter((exam) => exam.status === status)
      .filter((exam) => {
        if (!query) return true;
        return [
          reportingPatientName(exam.patient),
          exam.patient.medicalRecordNumber,
          exam.accessionNumber,
          exam.requestedProcedure,
          exam.modality,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => this.sortTimestamp(right).localeCompare(this.sortTimestamp(left)));
  });

  readonly selectedExam = computed(
    () => this.exams().find((exam) => exam.id === this.selectedExamId()) ?? null,
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listExams().subscribe({
      next: (exams) => {
        this.exams.set(exams);
        this.loading.set(false);
        this.selectFirstVisible();
      },
      error: () => {
        this.error.set('Reporting examinations could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  setViewFilter(filter: ReportViewFilter): void {
    this.viewFilter.set(filter);
    this.selectFirstVisible();
  }

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.selectFirstVisible();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.selectFirstVisible();
  }

  selectExam(exam: ReportingExamView): void {
    this.selectedExamId.set(exam.id);
    this.reportForm.reset({ reportText: '' });
  }

  submitReport(exam: ReportingExamView): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    this.openConfirmation('SUBMIT', exam, () => {
      this.saving.set(true);
      this.api
        .submitReport(exam.id, { reportText: this.reportForm.controls.reportText.value })
        .subscribe({
          next: (reported) => {
            this.replaceExam(reported);
            this.viewFilter.set('SUBMITTED');
            this.selectedExamId.set(reported.id);
            this.reportForm.reset({ reportText: '' });
            this.saving.set(false);
            this.snackBar.open('Report submitted. The examination is now reported.', 'Close', {
              duration: 3500,
            });
          },
          error: (error: Error) => {
            this.saving.set(false);
            this.snackBar.open(error.message || 'The report could not be submitted.', 'Close', {
              duration: 4500,
            });
          },
        });
    });
  }

  completeExam(exam: ReportingExamView): void {
    this.openConfirmation('COMPLETE', exam, () => {
      this.saving.set(true);
      this.api.completeExam(exam.id).subscribe({
        next: (completed) => {
          this.replaceExam(completed);
          this.viewFilter.set('COMPLETED');
          this.selectedExamId.set(completed.id);
          this.saving.set(false);
          this.snackBar.open('Examination completed.', 'Close', { duration: 3000 });
        },
        error: (error: Error) => {
          this.saving.set(false);
          this.snackBar.open(error.message || 'The examination could not be completed.', 'Close', {
            duration: 4500,
          });
        },
      });
    });
  }

  patientName(exam: ReportingExamView): string {
    return reportingPatientName(exam.patient);
  }

  modalityLabel(exam: ReportingExamView): string {
    return reportingModalityLabel(exam.modality);
  }

  statusLabel(status: ReportingExamStatus): string {
    return (
      {
        ACQUIRED: 'Needs report',
        REPORTED: 'Reported',
        COMPLETED: 'Completed',
      } as const
    )[status];
  }

  private openConfirmation(
    action: 'SUBMIT' | 'COMPLETE',
    exam: ReportingExamView,
    confirmedAction: () => void,
  ): void {
    this.dialog
      .open(ReportActionDialog, {
        data: {
          action,
          patientName: this.patientName(exam),
          requestedProcedure: exam.requestedProcedure,
        },
        width: '460px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) confirmedAction();
      });
  }

  private selectFirstVisible(): void {
    const visible = this.filteredExams();
    const selected = this.selectedExamId();
    if (selected !== null && visible.some((exam) => exam.id === selected)) return;
    if (visible[0]) {
      this.selectExam(visible[0]);
    } else {
      this.selectedExamId.set(null);
      this.reportForm.reset({ reportText: '' });
    }
  }

  private replaceExam(updated: ReportingExamView): void {
    this.exams.update((exams) => exams.map((exam) => (exam.id === updated.id ? updated : exam)));
  }

  private statusForFilter(filter: ReportViewFilter): ReportingExamStatus {
    return (
      {
        NEEDS_REPORT: 'ACQUIRED',
        SUBMITTED: 'REPORTED',
        COMPLETED: 'COMPLETED',
      } as const
    )[filter];
  }

  private sortTimestamp(exam: ReportingExamView): string {
    return exam.report?.submittedAt ?? exam.schedule?.scheduledStart ?? exam.updatedAt;
  }
}
