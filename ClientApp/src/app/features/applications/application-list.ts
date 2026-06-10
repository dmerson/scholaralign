import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-application-list',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <h2>Applications</h2>
      <p class="hint">Applications you are eligible to fill out appear here. Each application may link to one or more scholarships.</p>
      <p class="empty-msg">
        <mat-icon>assignment</mat-icon>
        No applications available yet.
      </p>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    h2 { margin-bottom: 8px; }
    .hint { color: #666; margin-bottom: 24px; }
    .empty-msg { display: flex; align-items: center; gap: 8px; color: #999; }
  `]
})
export class ApplicationListComponent {}
