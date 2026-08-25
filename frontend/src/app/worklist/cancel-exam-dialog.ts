import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ExamView, patientName } from './schedule';

@Component({
  selector: 'app-cancel-exam-dialog',
  imports: [DatePipe, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Cancel exam?</h2>
    <mat-dialog-content>
      <p>
        Cancel <strong>{{ data.requestedProcedure }}</strong> for <strong>{{ patientLabel }}</strong
        >?
      </p>
      @if (data.schedule) {
        <p>Appointment: {{ data.schedule.scheduledStart | date: 'EEE, dd MMM yyyy, HH:mm' }}</p>
      }
      <p class="warning">
        Cancellation is terminal and the exam will be removed from the active worklist.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Keep exam</button>
      <button mat-flat-button type="button" (click)="dialogRef.close(true)">Cancel exam</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .warning {
        color: var(--mat-sys-error);
      }
    `,
  ],
})
export class CancelExamDialog {
  readonly data = inject<ExamView>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CancelExamDialog, boolean>);
  readonly patientLabel = patientName(this.data.patient);
}
