import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ReportActionDialogData {
  action: 'SUBMIT' | 'COMPLETE';
  patientName: string;
  requestedProcedure: string;
}

@Component({
  selector: 'app-report-action-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ isSubmit ? 'Submit report?' : 'Complete examination?' }}</h2>
    <mat-dialog-content>
      <p>
        {{ isSubmit ? 'Submit the report' : 'Complete the examination' }} for
        <strong>{{ data.patientName }}</strong> — {{ data.requestedProcedure }}?
      </p>
      <p class="warning">
        @if (isSubmit) {
          Submitted reports are read-only in the initial system and cannot be edited.
        } @else {
          Completion is the final step in the examination lifecycle.
        }
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Go back</button>
      <button mat-flat-button type="button" (click)="dialogRef.close(true)">
        {{ isSubmit ? 'Submit report' : 'Complete exam' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .warning {
        color: var(--ris-text-secondary);
      }
    `,
  ],
})
export class ReportActionDialog {
  readonly data = inject<ReportActionDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ReportActionDialog, boolean>);
  readonly isSubmit = this.data.action === 'SUBMIT';
}
