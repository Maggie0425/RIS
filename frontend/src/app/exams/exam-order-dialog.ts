import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ExamApi } from './exam-api';
import { Exam, Modality, MODALITY_OPTIONS } from './exam';
import { ApiError } from '../patients/patient';
import { Patient, patientDisplayName } from '../patients/patient';

export interface ExamOrderDialogData {
  patient: Patient;
}

@Component({
  selector: 'app-exam-order-dialog',
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
    <h2 mat-dialog-title>Create examination order</h2>
    <mat-dialog-content>
      <p class="patient-line">
        Ordering for <strong>{{ patientName }}</strong> ({{ data.patient.medicalRecordNumber }}). The exam will start
        in <strong>ORDERED</strong> status.
      </p>
      <form id="exam-order-form" [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>Requested procedure</mat-label>
          <input matInput formControlName="requestedProcedure" maxlength="200" autocomplete="off" />
          @if (form.controls.requestedProcedure.hasError('server')) {
            <mat-error>{{ form.controls.requestedProcedure.getError('server') }}</mat-error>
          } @else if (form.controls.requestedProcedure.invalid) {
            <mat-error>Requested procedure is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Modality</mat-label>
          <mat-select formControlName="modality">
            @for (option of modalityOptions; track option.value) {
              <mat-option [value]="option.value">{{ option.label }}</mat-option>
            }
          </mat-select>
          @if (form.controls.modality.invalid) {
            <mat-error>Modality is required</mat-error>
          }
        </mat-form-field>
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="saving()" (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button form="exam-order-form" type="submit" [disabled]="saving()">
        @if (saving()) {
          <mat-spinner diameter="20" />
        } @else {
          Create order
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .patient-line {
        color: var(--ris-text-secondary);
        margin: 0 0 1rem;
      }
      form {
        display: grid;
        gap: 0.25rem;
        min-width: min(480px, 75vw);
        padding-top: 0.25rem;
      }
      mat-form-field {
        width: 100%;
      }
      .form-error {
        color: var(--mat-sys-error);
        margin: 0 0 0.5rem;
      }
      mat-spinner {
        display: inline-block;
      }
    `,
  ],
})
export class ExamOrderDialog {
  readonly data = inject<ExamOrderDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ExamOrderDialog, Exam | undefined>);
  private readonly api = inject(ExamApi);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly modalityOptions = MODALITY_OPTIONS;
  readonly patientName = patientDisplayName(this.data.patient);
  readonly form = new FormGroup({
    requestedProcedure: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    modality: new FormControl<Modality>('CT', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    this.api
      .create({
        patientId: this.data.patient.id,
        requestedProcedure: value.requestedProcedure.trim(),
        modality: value.modality,
      })
      .subscribe({
        next: (exam) => this.dialogRef.close(exam),
        error: (response: HttpErrorResponse) => {
          this.saving.set(false);
          const apiError = response.error as ApiError | undefined;
          for (const [field, message] of Object.entries(apiError?.fieldErrors ?? {})) {
            const control = this.form.get(field);
            if (control) {
              control.setErrors({ ...control.errors, server: message });
            }
          }
          this.error.set(apiError?.message ?? 'The examination order could not be created. Please try again.');
        },
      });
  }
}
