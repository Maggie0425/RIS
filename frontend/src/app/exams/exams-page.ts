import { Component } from '@angular/core';
import { PlaceholderPage } from '../shared/placeholder-page';

@Component({
  selector: 'app-exams-page',
  imports: [PlaceholderPage],
  template: `
    <app-placeholder-page title="Exams" description="Create and track imaging exam orders." />
  `,
})
export class ExamsPage {}
