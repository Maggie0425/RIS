import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthenticationApi } from './authentication-api';
import { AuthenticationError } from './authentication';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <main>
      <section class="welcome" aria-labelledby="system-name">
        <img src="favicon.svg" alt="" />
        <p class="eyebrow">Synthetic data environment</p>
        <h1 id="system-name">Radiology Information System</h1>
        <p>Secure access to patient, examination, scheduling and reporting workflows.</p>
      </section>

      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-icon mat-card-avatar svgIcon="lock"></mat-icon>
          <mat-card-title>Sign in</mat-card-title>
          <mat-card-subtitle>Use your synthetic staff account</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (sessionExpired) {
            <div class="notice" role="status">
              <mat-icon svgIcon="schedule"></mat-icon>
              Your session ended. Sign in again to continue.
            </div>
          }
          @if (error()) {
            <div class="error" role="alert">
              <mat-icon svgIcon="error"></mat-icon>
              {{ error() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Username</mat-label>
              <mat-icon matPrefix svgIcon="person"></mat-icon>
              <input
                matInput
                formControlName="username"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
              />
              @if (form.controls.username.invalid && form.controls.username.touched) {
                <mat-error>Enter your username</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix svgIcon="key"></mat-icon>
              <input
                matInput
                formControlName="password"
                [type]="showPassword() ? 'text' : 'password'"
                autocomplete="current-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                (click)="showPassword.update((shown) => !shown)"
              >
                <mat-icon
                  [svgIcon]="showPassword() ? 'visibility_off' : 'visibility'"
                ></mat-icon>
              </button>
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <mat-error>Enter your password</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button type="submit" [disabled]="submitting()">
              @if (submitting()) {
                <mat-spinner diameter="20" />
                Signing in…
              } @else {
                Sign in
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styles: `
    :host {
      background:
        radial-gradient(circle at 12% 8%, rgb(21 101 192 / 14%), transparent 30rem),
        var(--ris-page-background);
      border-top: 4px solid var(--ris-brand-orange);
      box-sizing: border-box;
      display: grid;
      min-height: 100vh;
      padding: 2rem;
      place-items: center;
    }
    main {
      align-items: center;
      display: grid;
      gap: clamp(2rem, 7vw, 7rem);
      grid-template-columns: minmax(0, 1fr) minmax(340px, 450px);
      max-width: 1080px;
      width: 100%;
    }
    .welcome img {
      height: 64px;
      margin-bottom: 1.25rem;
      width: 64px;
    }
    .eyebrow {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .welcome h1 {
      font: var(--mat-sys-display-small);
      letter-spacing: -0.03em;
      margin: 0 0 1rem;
      max-width: 650px;
    }
    .welcome p:last-child {
      color: var(--ris-text-secondary);
      font: var(--mat-sys-body-large);
      line-height: 1.6;
      max-width: 560px;
    }
    mat-card {
      background: var(--ris-surface);
      box-shadow: 0 18px 55px rgb(30 45 65 / 12%);
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
    mat-card-content {
      padding-top: 1.75rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    form > button {
      align-self: stretch;
      height: 48px;
      margin-top: 0.5rem;
    }
    form > button mat-spinner {
      display: inline-block;
      margin-right: 0.5rem;
    }
    .notice,
    .error {
      align-items: center;
      border-radius: 10px;
      display: flex;
      gap: 0.6rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
    }
    .notice {
      background: #eef4ff;
      color: #17467e;
    }
    .error {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
    .notice mat-icon,
    .error mat-icon {
      flex: 0 0 auto;
    }
    @media (max-width: 800px) {
      :host {
        padding: 1rem;
      }
      main {
        gap: 2rem;
        grid-template-columns: 1fr;
        max-width: 480px;
      }
      .welcome {
        display: none;
      }
    }
  `,
})
export class LoginPage {
  private readonly authentication = inject(AuthenticationApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly showPassword = signal(false);
  readonly error = signal<string | null>(null);
  readonly sessionExpired = this.route.snapshot.queryParamMap.get('sessionExpired') === 'true';
  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.authentication
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.returnUrl()),
        error: (response: HttpErrorResponse) => {
          const apiError = response.error as AuthenticationError | undefined;
          this.error.set(
            response.status === 401
              ? 'The username or password is incorrect.'
              : (apiError?.message ?? 'Sign in failed. Check that the backend is running.'),
          );
        },
      });
  }

  private returnUrl(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    return requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/dashboard';
  }
}
