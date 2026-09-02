import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ApiError, CreateUserRequest, ROLE_OPTIONS, RoleCode } from './user-management';
import { UserManagementApi } from './user-management-api';

@Component({
  selector: 'app-user-form-dialog',
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
    <h2 mat-dialog-title>Create staff account</h2>
    <mat-dialog-content>
      <form id="user-form" [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username" autocomplete="off" />
          <mat-hint>Letters, numbers, dots, underscores or hyphens</mat-hint>
          @if (form.controls.username.invalid && form.controls.username.touched) {
            <mat-error>{{
              fieldError('username', 'Enter a valid username (3–100 characters)')
            }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Display name</mat-label>
          <input matInput formControlName="displayName" autocomplete="name" />
          @if (form.controls.displayName.invalid && form.controls.displayName.touched) {
            <mat-error>{{ fieldError('displayName', 'Display name is required') }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Temporary password</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" />
          <mat-hint>12–128 characters</mat-hint>
          @if (form.controls.password.invalid && form.controls.password.touched) {
            <mat-error>{{
              fieldError('password', 'Password must contain at least 12 characters')
            }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Roles</mat-label>
          <mat-select formControlName="roles" multiple>
            @for (role of roles; track role.value) {
              <mat-option [value]="role.value">{{ role.label }}</mat-option>
            }
          </mat-select>
          @if (form.controls.roles.invalid && form.controls.roles.touched) {
            <mat-error>Select at least one role</mat-error>
          }
        </mat-form-field>
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="saving()" (click)="dialogRef.close()">
        Cancel
      </button>
      <button mat-flat-button type="submit" form="user-form" [disabled]="saving()">
        @if (saving()) {
          <mat-spinner diameter="20" />
        } @else {
          Create account
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      form {
        display: grid;
        min-width: min(480px, 75vw);
        padding-top: 0.5rem;
      }
      .form-error {
        color: var(--mat-sys-error);
      }
      mat-spinner {
        display: inline-block;
      }
      @media (max-width: 600px) {
        form {
          min-width: 0;
        }
      }
    `,
  ],
})
export class UserFormDialog {
  readonly dialogRef = inject(MatDialogRef<UserFormDialog>);
  private readonly api = inject(UserManagementApi);
  readonly roles = ROLE_OPTIONS;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});
  readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(/[A-Za-z0-9._-]+/),
      ],
    }),
    displayName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(200)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12), Validators.maxLength(128)],
    }),
    roles: new FormControl<RoleCode[]>([], {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  fieldError(field: string, fallback: string): string {
    return this.serverErrors()[field] ?? fallback;
  }

  save(): void {
    if (this.form.invalid || this.form.controls.roles.value.length === 0) {
      this.form.controls.roles.setErrors(
        this.form.controls.roles.value.length ? null : { required: true },
      );
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.serverErrors.set({});
    this.api.create(this.form.getRawValue() as CreateUserRequest).subscribe({
      next: (user) => this.dialogRef.close(user),
      error: (response: HttpErrorResponse) => {
        this.saving.set(false);
        const apiError = response.error as ApiError | undefined;
        this.serverErrors.set(apiError?.fieldErrors ?? {});
        for (const field of Object.keys(apiError?.fieldErrors ?? {}))
          this.form.get(field)?.setErrors({ server: true });
        this.error.set(apiError?.message ?? 'Account could not be created. Please try again.');
      },
    });
  }
}
