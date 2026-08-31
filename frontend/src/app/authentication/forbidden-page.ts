import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden-page',
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        <mat-icon svgIcon="lock"></mat-icon>
        <h1>Access restricted</h1>
        <p>Your account does not have permission to open this area.</p>
        <a mat-flat-button routerLink="/dashboard">Return to dashboard</a>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    mat-card {
      margin: 4rem auto;
      max-width: 520px;
      text-align: center;
    }
    mat-card-content {
      padding: 3rem 2rem;
    }
    mat-icon {
      color: var(--mat-sys-primary);
      font-size: 48px;
      height: 48px;
      width: 48px;
    }
    h1 {
      font: var(--mat-sys-headline-medium);
      margin-bottom: 0.5rem;
    }
    p {
      color: var(--ris-text-secondary);
      margin: 0 0 1.5rem;
    }
  `,
})
export class ForbiddenPage {}
