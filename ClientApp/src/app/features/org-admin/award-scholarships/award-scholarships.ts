import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-award-scholarships',
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <h2>Award Scholarships</h2>
      <p class="hint">Scholarships past their end date and under review appear here. Review all committee notes and ratings for each applicant, then select recipients to award.</p>
      <p class="empty-msg"><mat-icon>emoji_events</mat-icon> No scholarships ready to award.</p>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    h2 { margin-bottom: 8px; }
    .hint { color: #666; margin-bottom: 24px; }
    .empty-msg { display: flex; align-items: center; gap: 8px; color: #999; }
  `]
})
export class AwardScholarshipsComponent {}
