import { Component } from '@angular/core';
import { PlaceholderPage } from '../shared/placeholder-page';

@Component({
  selector: 'app-users-page',
  imports: [PlaceholderPage],
  template: `
    <app-placeholder-page
      title="User administration"
      description="Manage staff accounts and fixed role assignments."
    />
  `,
})
export class UsersPage {}
