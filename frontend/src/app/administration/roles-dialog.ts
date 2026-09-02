import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ApiError, ManagedUser, ROLE_OPTIONS, RoleCode } from './user-management';
import { UserManagementApi } from './user-management-api';

@Component({
  selector: 'app-roles-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit roles</h2>
    <mat-dialog-content>
      <p>
        Replace roles for <strong>{{ data.displayName }}</strong
        >.
      </p>
      <mat-form-field appearance="outline">
        <mat-label>Roles</mat-label>
        <mat-select [formControl]="rolesControl" multiple>
          @for (role of roleOptions; track role.value) {
            <mat-option [value]="role.value">{{ role.label }}</mat-option>
          }
        </mat-select>
        @if (rolesControl.invalid) {
          <mat-error>Select at least one role</mat-error>
        }
      </mat-form-field>
      @if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="saving()" (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button [disabled]="saving()" (click)="save()">
        @if (saving()) {
          <mat-spinner diameter="20" />
        } @else {
          Save roles
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-form-field {
        width: 100%;
      }
      .form-error {
        color: var(--mat-sys-error);
      }
      mat-spinner {
        display: inline-block;
      }
    `,
  ],
})
export class RolesDialog {
  readonly data = inject<ManagedUser>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<RolesDialog>);
  private readonly api = inject(UserManagementApi);
  readonly roleOptions = ROLE_OPTIONS;
  readonly rolesControl = new FormControl<RoleCode[]>(this.data.roles, {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  save(): void {
    if (this.rolesControl.invalid || this.rolesControl.value.length === 0) {
      this.rolesControl.setErrors({ required: true });
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api.replaceRoles(this.data.id, this.rolesControl.value).subscribe({
      next: (user) => this.dialogRef.close(user),
      error: (response: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(
          (response.error as ApiError | undefined)?.message ?? 'Roles could not be updated.',
        );
      },
    });
  }
}
