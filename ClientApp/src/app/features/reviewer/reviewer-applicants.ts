import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reviewer-applicants',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <h2>Reviewer — Applicants</h2>
      <p class="hint">All submitted applications for this scholarship. Click an applicant to write or update your review.</p>
      <p class="empty-msg">
        <mat-icon>people</mat-icon>
        No submitted applications for this scholarship.
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
export class ReviewerApplicantsComponent {}
