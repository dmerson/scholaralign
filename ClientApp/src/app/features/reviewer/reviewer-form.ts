import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reviewer-form',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page">
      <h2>Reviewer — Review Form</h2>
      <p class="hint">View the applicant's submitted answers, then enter your notes, rating, and decision.</p>
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>person</mat-icon>
          <mat-card-title>Applicant Answers</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="coming-soon">Applicant answers coming soon.</p>
        </mat-card-content>
      </mat-card>
      <mat-card class="review-card">
        <mat-card-header>
          <mat-card-title>Your Review</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="coming-soon">Review form (notes, rating, decision) coming soon.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    h2 { margin-bottom: 8px; }
    .hint { color: #666; margin-bottom: 24px; }
    mat-card { max-width: 700px; margin-bottom: 24px; }
    mat-icon[mat-card-avatar] { font-size: 40px; height: 40px; width: 40px; color: #1976d2; }
    .coming-soon { color: #999; font-style: italic; }
  `]
})
export class ReviewerFormComponent {}
