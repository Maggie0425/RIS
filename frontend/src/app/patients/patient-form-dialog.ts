import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ApiError, Patient, PatientRequest, PatientSex } from './patient';
import { PatientApi } from './patient-api';

@Component({
  selector: 'app-patient-form-dialog',
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
    <h2 mat-dialog-title>{{ data ? 'Edit patient' : 'Register patient' }}</h2>
    <mat-dialog-content
      ><form id="patient-form" [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline"
          ><mat-label>Medical record number</mat-label
          ><input
            matInput
            formControlName="medicalRecordNumber"
            maxlength="50"
            autocomplete="off"
          />
          @if (form.controls.medicalRecordNumber.hasError('server')) {
            <mat-error>{{ form.controls.medicalRecordNumber.getError('server') }}</mat-error>
          } @else if (form.controls.medicalRecordNumber.invalid) {
            <mat-error>Medical record number is required</mat-error>
          }
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline"
            ><mat-label>First name</mat-label
            ><input
              matInput
              formControlName="firstName"
              maxlength="100"
              autocomplete="given-name"
            />
            @if (form.controls.firstName.invalid) {
              <mat-error>First name is required</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline"
            ><mat-label>Last name</mat-label
            ><input
              matInput
              formControlName="lastName"
              maxlength="100"
              autocomplete="family-name"
            />
            @if (form.controls.lastName.invalid) {
              <mat-error>Last name is required</mat-error>
            }
          </mat-form-field>
        </div>
        <div class="row">
          <mat-form-field appearance="outline"
            ><mat-label>Date of birth</mat-label
            ><input matInput type="date" formControlName="dateOfBirth" [max]="today" />
            @if (form.controls.dateOfBirth.invalid) {
              <mat-error>Enter a valid date of birth</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline"
            ><mat-label>Sex</mat-label
            ><mat-select formControlName="sex">
              @for (option of sexOptions; track option.value) {
                <mat-option [value]="option.value">{{ option.label }}</mat-option>
              }
            </mat-select>
            @if (form.controls.sex.invalid) {
              <mat-error>Sex is required</mat-error>
            }
          </mat-form-field>
        </div>
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }
      </form></mat-dialog-content
    >
    <mat-dialog-actions align="end"
      ><button mat-button type="button" [disabled]="saving()" (click)="dialogRef.close()">
        Cancel</button
      ><button mat-flat-button form="patient-form" type="submit" [disabled]="saving()">
        @if (saving()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ data ? 'Save changes' : 'Register patient' }}
        }
      </button></mat-dialog-actions
    >
  `,
  styles: [
    `
      form {
        padding-top: 0.5rem;
        min-width: min(520px, 75vw);
      }
      mat-form-field {
        width: 100%;
      }
      .row {
        display: grid;
        gap: 1rem;
        grid-template-columns: 1fr 1fr;
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
        .row {
          grid-template-columns: 1fr;
          gap: 0;
        }
      }
    `,
  ],
})
export class PatientFormDialog {
  readonly data = inject<Patient | null>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<PatientFormDialog>);
  private readonly api = inject(PatientApi);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly today = new Date().toISOString().slice(0, 10);
  readonly sexOptions: { value: PatientSex; label: string }[] = [
    { value: 'FEMALE', label: 'Female' },
    { value: 'MALE', label: 'Male' },
    { value: 'OTHER', label: 'Other' },
    { value: 'UNKNOWN', label: 'Unknown' },
  ];
  readonly form = new FormGroup({
    medicalRecordNumber: new FormControl(this.data?.medicalRecordNumber ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    firstName: new FormControl(this.data?.firstName ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    lastName: new FormControl(this.data?.lastName ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    dateOfBirth: new FormControl(this.data?.dateOfBirth ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    sex: new FormControl<PatientSex>(this.data?.sex ?? 'UNKNOWN', {
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
    const request = this.form.getRawValue() as PatientRequest;
    (this.data ? this.api.update(this.data.id, request) : this.api.create(request)).subscribe({
      next: (patient) => this.dialogRef.close(patient),
      error: (response: HttpErrorResponse) => {
        this.saving.set(false);
        const apiError = response.error as ApiError | undefined;
        for (const [field, message] of Object.entries(apiError?.fieldErrors ?? {})) {
          const control = this.form.get(field);
          if (control) control.setErrors({ ...control.errors, server: message });
        }
        this.error.set(apiError?.message ?? 'Patient could not be saved. Please try again.');
      },
    });
  }
}
