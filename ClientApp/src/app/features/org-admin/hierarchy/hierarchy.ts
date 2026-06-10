import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-hierarchy',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <h2>Organization Hierarchy</h2>
      <p class="hint">Create and manage suborganizations (committees, departments). Assign members to committees here. Members assigned to a committee inherit reviewer access for any scholarships that committee is assigned to.</p>
      <p class="coming-soon"><mat-icon>account_tree</mat-icon> Hierarchy management coming soon.</p>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    h2 { margin-bottom: 8px; }
    .hint { color: #666; margin-bottom: 24px; }
    .coming-soon { display: flex; align-items: center; gap: 8px; color: #999; font-style: italic; }
  `]
})
export class HierarchyComponent {}
