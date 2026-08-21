import { Component, input } from '@angular/core';

@Component({
  selector: 'app-placeholder-page',
  template: `
    <header>
      <div class="heading-copy">
        <p class="eyebrow">RIS workspace</p>
        <h1>{{ title() }}</h1>
        <p>{{ description() }}</p>
      </div>
    </header>
    <section aria-label="Implementation status">
      <span class="status-mark" aria-hidden="true">•••</span>
      <div>
        <h2>Feature implementation pending</h2>
        <p>The assigned feature team will add this page's components and API integration.</p>
      </div>
    </section>
  `,
  styles: `
    header {
      background: linear-gradient(135deg, #ffffff 15%, #edf4ff 100%);
      border: 1px solid #dbe6f5;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgb(36 64 98 / 7%);
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
    header > p:last-child,
    section p {
      color: var(--ris-text-secondary);
    }
    .heading-copy > p:last-child {
      color: var(--ris-text-secondary);
      font-size: 1rem;
      margin: 0;
    }
    section {
      align-items: center;
      background: var(--ris-surface);
      border: 1px solid var(--ris-border);
      border-radius: 14px;
      box-shadow: 0 4px 16px rgb(36 64 98 / 5%);
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
    }
    section h2 {
      font: var(--mat-sys-title-medium);
      margin: 0 0 0.5rem;
    }
    section p {
      margin: 0;
    }
    .status-mark {
      align-items: center;
      background: #e8f0fe;
      border-radius: 12px;
      color: var(--mat-sys-primary);
      display: flex;
      flex: 0 0 48px;
      font-weight: 700;
      height: 48px;
      justify-content: center;
      letter-spacing: 0.08em;
    }
    @media (max-width: 600px) {
      header {
        padding: 1.5rem;
      }
      section {
        align-items: flex-start;
      }
    }
  `,
})
export class PlaceholderPage {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
