import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-users-roles',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <h2>Users &amp; Roles</h2>
      <p class="hint">Add users to your organization and assign them roles (Scholarship Viewer, Organization Admin, Scholarship Maker, Reviewer).</p>
      <p class="coming-soon"><mat-icon>people</mat-icon> Users &amp; Roles management coming soon.</p>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    h2 { margin-bottom: 8px; }
    .hint { color: #666; margin-bottom: 24px; }
    .coming-soon { display: flex; align-items: center; gap: 8px; color: #999; font-style: italic; }
  `]
})
export class UsersRolesComponent {}
