import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  template: `
    <main>
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-icon mat-card-avatar>local_hospital</mat-icon>
          <mat-card-title>Radiology Information System</mat-card-title>
          <mat-card-subtitle>University of Sydney student project</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <h1>Sign in</h1>
          <p>Authentication will be implemented by the authentication feature team.</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-flat-button routerLink="/dashboard">Enter frontend skeleton</a>
        </mat-card-actions>
      </mat-card>
    </main>
  `,
  styles: `
    :host {
      background: var(--ris-page-background);
      border-top: 4px solid var(--ris-brand-orange);
      box-sizing: border-box;
      display: grid;
      min-height: 100vh;
      padding: 1rem;
      place-items: center;
    }
    main {
      max-width: 460px;
      width: 100%;
    }
    mat-card {
      background: var(--ris-surface);
      padding: 1rem;
    }
    mat-icon[mat-card-avatar] {
      align-items: center;
      background: var(--ris-brand-charcoal);
      border-radius: 50%;
      color: #fff;
      display: flex;
      justify-content: center;
    }
    h1 {
      font: var(--mat-sys-headline-small);
      margin-top: 2rem;
    }
    p {
      color: var(--ris-text-secondary);
    }
  `,
})
export class LoginPage {}
