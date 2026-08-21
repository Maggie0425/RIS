import { Component } from '@angular/core';
import { PlaceholderPage } from '../shared/placeholder-page';

@Component({
  selector: 'app-reports-page',
  imports: [PlaceholderPage],
  template: `
    <app-placeholder-page title="Reports" description="Author and review radiology reports." />
  `,
})
export class ReportsPage {}
