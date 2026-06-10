import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-committees',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <h2>Assign Committees to Scholarships</h2>
      <p class="hint">Link a committee (suborganization) to one or more scholarships. Committee members will be able to review applications for all assigned scholarships.</p>
      <p class="coming-soon"><mat-icon>group_work</mat-icon> Committee assignment coming soon.</p>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    h2 { margin-bottom: 8px; }
    .hint { color: #666; margin-bottom: 24px; }
    .coming-soon { display: flex; align-items: center; gap: 8px; color: #999; font-style: italic; }
  `]
})
export class CommitteesComponent {}
