import { Component } from '@angular/core';
import { PlaceholderPage } from '../shared/placeholder-page';

@Component({
  selector: 'app-dashboard-page',
  imports: [PlaceholderPage],
  template: `
    <app-placeholder-page
      title="Dashboard"
      description="An overview of radiology workflow activity."
    />
  `,
})
export class DashboardPage {}
