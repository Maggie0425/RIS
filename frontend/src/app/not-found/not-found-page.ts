import { Component } from '@angular/core';
import { PlaceholderPage } from '../shared/placeholder-page';

@Component({
  selector: 'app-not-found-page',
  imports: [PlaceholderPage],
  template: `
    <app-placeholder-page
      title="Page not found"
      description="The requested RIS page does not exist."
    />
  `,
})
export class NotFoundPage {}
