import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reviewer-scholarships',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <h2>Reviewer — My Scholarships</h2>
      <p class="hint">Scholarships assigned to your committee that are currently under review appear here. Awarded scholarships are removed from this list.</p>
      <p class="empty-msg">
        <mat-icon>rate_review</mat-icon>
        No scholarships assigned for review.
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
export class ReviewerScholarshipsComponent {}
