import { Component } from '@angular/core';
import { PlaceholderPage } from '../shared/placeholder-page';

@Component({
  selector: 'app-worklist-page',
  imports: [PlaceholderPage],
  template: `
    <app-placeholder-page
      title="Worklist"
      description="View active scheduled examinations and acquisition readiness."
    />
  `,
})
export class WorklistPage {}
