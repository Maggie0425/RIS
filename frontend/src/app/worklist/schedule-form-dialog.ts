import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ScheduleApi } from './schedule-api';
import {
  ExamView,
  localDateKey,
  localDateTimeToIso,
  localTimeValue,
  patientName,
} from './schedule';

export interface ScheduleFormDialogData {
  exam: ExamView | null;
  orderedExams: ExamView[];
  initialDate?: string;
  initialTime?: string;
}

@Component({
  selector: 'app-schedule-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isReschedule ? 'Reschedule exam' : 'Schedule exam' }}</h2>
    <mat-dialog-content>
      <form id="schedule-form" [formGroup]="form" (ngSubmit)="save()">
        @if (!isReschedule) {
          <mat-form-field appearance="outline">
            <mat-label>Exam order</mat-label>
            <mat-select formControlName="examId">
              @for (exam of data.orderedExams; track exam.id) {
                <mat-option [value]="exam.id">
                  {{ exam.accessionNumber }} — {{ exam.requestedProcedure }}
                </mat-option>
              }
            </mat-select>
            @if (form.controls.examId.invalid) {
              <mat-error>Select an exam order</mat-error>
            }
          </mat-form-field>
        }

        @if (selectedExam(); as exam) {
          <section class="exam-summary" aria-label="Selected exam order">
            <div>
              <span>Patient</span>
              <strong>{{ patientLabel(exam) }}</strong>
            </div>
            <div>
              <span>Procedure</span>
              <strong>{{ exam.requestedProcedure }}</strong>
            </div>
            <div>
              <span>Modality</span>
              <strong>{{ exam.modality }}</strong>
            </div>
            <div>
              <span>Accession</span>
              <strong>{{ exam.accessionNumber }}</strong>
            </div>
          </section>
        }

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Date</mat-label>
            <input matInput type="date" formControlName="date" [min]="today" />
            @if (form.controls.date.invalid) {
              <mat-error>Choose a valid date</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Start time</mat-label>
            <input matInput type="time" formControlName="startTime" step="1800" />
            @if (form.controls.startTime.invalid) {
              <mat-error>Choose a start time</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Station AE title</mat-label>
          <input
            matInput
            formControlName="stationAeTitle"
            maxlength="16"
            autocomplete="off"
            placeholder="e.g. CT_1"
            list="station-ae-title-suggestions"
          />
          <mat-hint>Maximum 16 characters; supplied to the DICOM worklist</mat-hint>
          @if (form.controls.stationAeTitle.invalid) {
            <mat-error>Enter a station AE title</mat-error>
          }
        </mat-form-field>
        <datalist id="station-ae-title-suggestions">
          <option value="CT_1"></option>
          <option value="MRI_1"></option>
          <option value="XRAY_1"></option>
          <option value="US_1"></option>
        </datalist>

        <p class="availability-note">
          The selected time is provisional until the backend validates scheduling conflicts.
        </p>
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="saving()" (click)="dialogRef.close()">
        Close
      </button>
      <button mat-flat-button type="submit" form="schedule-form" [disabled]="saving()">
        @if (saving()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ isReschedule ? 'Save new time' : 'Schedule exam' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      form {
        min-width: min(560px, 76vw);
        padding-top: 0.5rem;
      }
      mat-form-field {
        width: 100%;
      }
      .row {
        display: grid;
        gap: 1rem;
        grid-template-columns: 1fr 1fr;
      }
      .exam-summary {
        background: var(--ris-page-background);
        border: 1px solid var(--ris-border);
        border-radius: 10px;
        display: grid;
        gap: 0.75rem 1.25rem;
        grid-template-columns: 1fr 1fr;
        margin-bottom: 1.25rem;
        padding: 1rem;
      }
      .exam-summary div {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .exam-summary span {
        color: var(--ris-text-secondary);
        font: var(--mat-sys-label-medium);
      }
      .exam-summary strong {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .availability-note {
        color: var(--ris-text-secondary);
        font: var(--mat-sys-body-small);
        margin: -0.25rem 0 1rem;
      }
      .form-error {
        color: var(--mat-sys-error);
        margin: 0 0 1rem;
      }
      mat-spinner {
        display: inline-block;
      }
      @media (max-width: 600px) {
        form {
          min-width: 0;
        }
        .row,
        .exam-summary {
          grid-template-columns: 1fr;
        }
        .row {
          gap: 0;
        }
      }
    `,
  ],
})
export class ScheduleFormDialog {
  readonly data = inject<ScheduleFormDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ScheduleFormDialog, ExamView | undefined>);
  private readonly api = inject(ScheduleApi);

  readonly isReschedule = this.data.exam?.status === 'SCHEDULED';
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly today = localDateKey(new Date());

  private readonly existingStart = this.data.exam?.schedule
    ? new Date(this.data.exam.schedule.scheduledStart)
    : null;
  private readonly defaultStart = this.nextAvailableStart();

  readonly form = new FormGroup({
    examId: new FormControl<number | null>(this.data.exam?.id ?? null, Validators.required),
    date: new FormControl(
      this.data.initialDate ??
        (this.existingStart ? localDateKey(this.existingStart) : localDateKey(this.defaultStart)),
      { nonNullable: true, validators: [Validators.required] },
    ),
    startTime: new FormControl(
      this.data.initialTime ??
        (this.existingStart
          ? localTimeValue(this.existingStart)
          : localTimeValue(this.defaultStart)),
      { nonNullable: true, validators: [Validators.required] },
    ),
    stationAeTitle: new FormControl(this.data.exam?.schedule?.stationAeTitle ?? '', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(16),
        Validators.pattern(/^\S(?:.*\S)?$/),
      ],
    }),
  });

  private readonly selectedExamId = toSignal(this.form.controls.examId.valueChanges, {
    initialValue: this.form.controls.examId.value,
  });

  readonly selectedExam = computed(() => {
    const id = this.selectedExamId();
    if (this.data.exam?.id === id) return this.data.exam;
    return this.data.orderedExams.find((exam) => exam.id === id) ?? null;
  });

  patientLabel(exam: ExamView): string {
    return `${patientName(exam.patient)} (${exam.patient.medicalRecordNumber})`;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const examId = value.examId;
    if (examId === null) return;
    const scheduledStart = localDateTimeToIso(value.date, value.startTime);
    if (new Date(scheduledStart).getTime() < Date.now()) {
      this.error.set('Choose a date and time in the future.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const request = {
      scheduledStart,
      stationAeTitle: value.stationAeTitle,
    };
    (this.isReschedule
      ? this.api.reschedule(examId, request)
      : this.api.schedule(examId, request)
    ).subscribe({
      next: (exam) => this.dialogRef.close(exam),
      error: (error: Error) => {
        this.saving.set(false);
        this.error.set(error.message || 'The exam could not be scheduled.');
      },
    });
  }

  private nextAvailableStart(): Date {
    const start = new Date();
    start.setSeconds(0, 0);
    const minutesUntilNextHalfHour = 30 - (start.getMinutes() % 30);
    start.setMinutes(start.getMinutes() + minutesUntilNextHalfHour);
    return start;
  }
}
