import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { DashboardApi } from './dashboard-api';
import { DashboardSummary } from './dashboard-summary';

interface StatusCard {
  key: keyof DashboardSummary;
  label: string;
  description: string;
  icon: string;
  status: string | null;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  template: `
    <header>
      <div>
        <p class="eyebrow">RIS workspace</p>
        <h1>Dashboard</h1>
        <p class="subtitle">An overview of radiology workflow activity.</p>
      </div>
      <button mat-stroked-button (click)="load()" [disabled]="loading()">
        <mat-icon>refresh</mat-icon>
        Refresh
      </button>
    </header>

    @if (error()) {
      <mat-card appearance="outlined" class="error-card" role="alert">
        <mat-card-content>
          <div>
            <mat-icon>error_outline</mat-icon>
            <span>{{ error() }}</span>
          </div>
          <button mat-button (click)="load()">Try again</button>
        </mat-card-content>
      </mat-card>
    }

    @if (loading()) {
      <div class="state" aria-live="polite">
        <mat-spinner diameter="42" />
        <p>Loading workflow summary…</p>
      </div>
    } @else if (summary(); as data) {
      @if (data.totalExams === 0) {
        <mat-card appearance="outlined" class="empty-state">
          <mat-card-content>
            <span class="empty-icon" aria-hidden="true"><mat-icon>inbox</mat-icon></span>
            <h2>No examination activity yet</h2>
            <p>Exam statistics will appear after the first order is created.</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <section class="summary-grid" aria-label="Examination status summary">
          @for (card of cards; track card.key) {
            <a
              class="summary-card-link"
              [routerLink]="['/exams']"
              [queryParams]="card.status ? { status: card.status } : {}"
              [attr.aria-label]="
                card.status ? 'View ' + card.label.toLowerCase() + ' examinations' : 'View all examinations'
              "
            >
              <mat-card
                appearance="outlined"
                class="summary-card"
                [class.total-card]="card.key === 'totalExams'"
              >
                <mat-card-content>
                  <div class="card-heading">
                    <span class="icon-box" aria-hidden="true"
                      ><mat-icon>{{ card.icon }}</mat-icon></span
                    >
                    <span>{{ card.label }}</span>
                    <mat-icon class="open-icon" aria-hidden="true">arrow_forward</mat-icon>
                  </div>
                  <strong class="metric">{{ data[card.key] }}</strong>
                  <p>{{ card.description }}</p>
                </mat-card-content>
              </mat-card>
            </a>
          }
        </section>

        <mat-card appearance="outlined" class="distribution-card">
          <mat-card-header>
            <mat-card-title>Workflow distribution</mat-card-title>
            <mat-card-subtitle>Share of examinations by current status</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @for (card of statusCards; track card.key) {
              <div class="distribution-row">
                <div class="distribution-label">
                  <span>{{ card.label }}</span>
                  <strong>{{ percentage(data[card.key], data.totalExams) }}%</strong>
                </div>
                <div
                  class="distribution-track"
                  role="progressbar"
                  [attr.aria-label]="card.label + ' examinations'"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  [attr.aria-valuenow]="percentage(data[card.key], data.totalExams)"
                >
                  <span
                    class="distribution-fill"
                    [style.width.%]="percentage(data[card.key], data.totalExams)"
                  ></span>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
      @if (lastRefreshed(); as refreshedAt) {
        <p class="last-refreshed" aria-live="polite">
          <mat-icon aria-hidden="true">schedule</mat-icon>
          Last refreshed: {{ refreshedAt | date: 'dd MMM yyyy, HH:mm:ss' }}
        </p>
      }
    }
  `,
  styles: [
    `
      header {
        align-items: start;
        background: linear-gradient(135deg, #ffffff 15%, #edf4ff 100%);
        border: 1px solid #dbe6f5;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgb(36 64 98 / 7%);
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        overflow: hidden;
        padding: 1.75rem 2rem;
        position: relative;
      }
      header::before {
        background: var(--ris-brand-orange);
        content: '';
        inset: 0 auto 0 0;
        position: absolute;
        width: 5px;
      }
      .eyebrow {
        color: var(--mat-sys-primary);
        font: var(--mat-sys-label-large);
        letter-spacing: 0.04em;
        margin: 0 0 0.5rem;
        text-transform: uppercase;
      }
      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0 0 0.5rem;
      }
      .subtitle {
        color: var(--ris-text-secondary);
        margin: 0;
      }
      .summary-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      }
      .summary-card {
        background: var(--ris-surface);
        border-color: var(--ris-border);
        min-height: 180px;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease,
          transform 160ms ease;
      }
      .summary-card-link {
        color: inherit;
        display: block;
        text-decoration: none;
      }
      .summary-card-link:hover .summary-card,
      .summary-card-link:focus-visible .summary-card {
        border-color: var(--mat-sys-primary);
        box-shadow: 0 8px 22px rgb(21 101 192 / 14%);
        transform: translateY(-2px);
      }
      .summary-card-link:focus-visible {
        border-radius: 14px;
      }
      .summary-card mat-card-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 1.25rem;
      }
      .total-card {
        background: linear-gradient(145deg, #ffffff, #edf4ff);
        border-color: #b8cff2;
      }
      .card-heading {
        align-items: center;
        color: var(--ris-text-secondary);
        display: flex;
        font: var(--mat-sys-title-small);
        gap: 0.75rem;
      }
      .open-icon {
        color: var(--mat-sys-primary);
        margin-left: auto;
      }
      .icon-box {
        align-items: center;
        background: #e8f0fe;
        border-radius: 10px;
        color: var(--mat-sys-primary);
        display: inline-flex;
        height: 40px;
        justify-content: center;
        width: 40px;
      }
      .metric {
        color: var(--ris-text-primary);
        font: var(--mat-sys-display-small);
        margin: 1rem 0 0.5rem;
      }
      .summary-card p {
        color: var(--ris-text-secondary);
        font: var(--mat-sys-body-small);
        margin: auto 0 0;
      }
      .distribution-card {
        background: var(--ris-surface);
        border-color: var(--ris-border);
        margin-top: 1rem;
      }
      .distribution-card mat-card-header {
        padding: 1.25rem 1.25rem 0;
      }
      .distribution-card mat-card-content {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
      }
      .distribution-label {
        align-items: center;
        display: flex;
        font: var(--mat-sys-body-medium);
        justify-content: space-between;
        margin-bottom: 0.4rem;
      }
      .distribution-label strong {
        color: var(--ris-text-secondary);
        font: var(--mat-sys-label-large);
      }
      .distribution-track {
        background: #e8edf3;
        border-radius: 999px;
        height: 10px;
        overflow: hidden;
      }
      .distribution-fill {
        background: var(--mat-sys-primary);
        border-radius: inherit;
        display: block;
        height: 100%;
        min-width: 2px;
        transition: width 180ms ease;
      }
      .state {
        align-items: center;
        color: var(--ris-text-secondary);
        display: flex;
        flex-direction: column;
        padding: 4rem 1rem;
        text-align: center;
      }
      .empty-state {
        background: var(--ris-surface);
        border-color: var(--ris-border);
      }
      .empty-state mat-card-content {
        align-items: center;
        display: flex;
        flex-direction: column;
        padding: 4rem 1.5rem;
        text-align: center;
      }
      .empty-state h2 {
        font: var(--mat-sys-title-large);
        margin: 1rem 0 0.5rem;
      }
      .empty-state p,
      .last-refreshed {
        color: var(--ris-text-secondary);
      }
      .empty-state p {
        margin: 0;
      }
      .empty-icon {
        align-items: center;
        background: #e8f0fe;
        border-radius: 50%;
        color: var(--mat-sys-primary);
        display: flex;
        height: 64px;
        justify-content: center;
        width: 64px;
      }
      .empty-icon mat-icon {
        font-size: 32px;
        height: 32px;
        width: 32px;
      }
      .last-refreshed {
        align-items: center;
        display: flex;
        font: var(--mat-sys-body-small);
        gap: 0.4rem;
        justify-content: flex-end;
        margin: 1rem 0 0;
      }
      .last-refreshed mat-icon {
        font-size: 16px;
        height: 16px;
        width: 16px;
      }
      .error-card {
        border-color: var(--mat-sys-error);
        color: var(--mat-sys-error);
        margin-bottom: 1rem;
      }
      .error-card mat-card-content,
      .error-card mat-card-content > div {
        align-items: center;
        display: flex;
        gap: 0.75rem;
      }
      .error-card mat-card-content {
        justify-content: space-between;
      }
      @media (max-width: 600px) {
        header {
          align-items: stretch;
          flex-direction: column;
          padding: 1.5rem;
        }
        header button {
          align-self: start;
        }
        .summary-grid {
          grid-template-columns: 1fr;
        }
        .error-card mat-card-content {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class DashboardPage {
  private readonly api = inject(DashboardApi);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly lastRefreshed = signal<Date | null>(null);
  readonly cards: readonly StatusCard[] = [
    {
      key: 'totalExams',
      label: 'Total exams',
      description: 'All examination orders in the system.',
      icon: 'monitoring',
      status: null,
    },
    {
      key: 'ordered',
      label: 'Ordered',
      description: 'Orders waiting to be scheduled.',
      icon: 'assignment',
      status: 'ORDERED',
    },
    {
      key: 'scheduled',
      label: 'Scheduled',
      description: 'Exams ready for the modality worklist.',
      icon: 'event',
      status: 'SCHEDULED',
    },
    {
      key: 'acquired',
      label: 'Acquired',
      description: 'Imaging completed and awaiting a report.',
      icon: 'radiology',
      status: 'ACQUIRED',
    },
    {
      key: 'reported',
      label: 'Reported',
      description: 'Reports submitted and awaiting completion.',
      icon: 'description',
      status: 'REPORTED',
    },
    {
      key: 'completed',
      label: 'Completed',
      description: 'Examinations with a closed workflow.',
      icon: 'task_alt',
      status: 'COMPLETED',
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      description: 'Orders cancelled before acquisition.',
      icon: 'event_busy',
      status: 'CANCELLED',
    },
  ];
  readonly statusCards = this.cards.filter((card) => card.key !== 'totalExams');

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.lastRefreshed.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Dashboard summary could not be loaded. Check that the backend is running.');
        this.loading.set(false);
      },
    });
  }

  percentage(value: number, total: number): number {
    return total === 0 ? 0 : Math.round((value / total) * 1000) / 10;
  }
}
