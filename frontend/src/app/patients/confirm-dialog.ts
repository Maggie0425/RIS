import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
@Component({
  imports: [MatButtonModule, MatDialogModule],
  template: `<h2 mat-dialog-title>Delete patient?</h2>
    <mat-dialog-content
      >This will permanently delete <strong>{{ data }}</strong
      >.</mat-dialog-content
    ><mat-dialog-actions align="end"
      ><button mat-button (click)="ref.close(false)">Cancel</button
      ><button mat-flat-button (click)="ref.close(true)">Delete</button></mat-dialog-actions
    >`,
})
export class ConfirmDialog {
  readonly data = inject<string>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<ConfirmDialog>);
}
