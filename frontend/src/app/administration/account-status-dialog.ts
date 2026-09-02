import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiError, ManagedUser } from './user-management';
import { UserManagementApi } from './user-management-api';

@Component({
  selector: 'app-account-status-dialog',
  imports: [MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data.enabled ? 'Disable account?' : 'Enable account?' }}</h2>
    <mat-dialog-content>
      <p>
        {{
          data.enabled
            ? 'This user will no longer be able to sign in.'
            : 'This user will be able to sign in again.'
        }}
      </p>
      <p>
        <strong>{{ data.displayName }}</strong> ({{ data.username }})
      </p>
      @if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="saving()" (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button [disabled]="saving()" (click)="confirm()">
        @if (saving()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ data.enabled ? 'Disable' : 'Enable' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form-error {
        color: var(--mat-sys-error);
      }
      mat-spinner {
        display: inline-block;
      }
    `,
  ],
})
export class AccountStatusDialog {
  readonly data = inject<ManagedUser>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AccountStatusDialog>);
  private readonly api = inject(UserManagementApi);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  confirm(): void {
    this.saving.set(true);
    this.error.set(null);
    this.api.setEnabled(this.data.id, !this.data.enabled).subscribe({
      next: (user) => this.dialogRef.close(user),
      error: (response: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(
          (response.error as ApiError | undefined)?.message ??
            'Account status could not be updated.',
        );
      },
    });
  }
}
