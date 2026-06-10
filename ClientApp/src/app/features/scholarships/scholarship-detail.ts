import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-scholarship-detail',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="page">
      <a mat-button routerLink="/scholarships">
        <mat-icon>arrow_back</mat-icon> Back to Scholarships
      </a>
      <mat-card class="detail-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>school</mat-icon>
          <mat-card-title>Scholarship Name</mat-card-title>
          <mat-card-subtitle>Amount · Deadline</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p class="coming-soon">Scholarship details coming soon.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" disabled>Apply</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .detail-card { max-width: 700px; margin-top: 16px; }
    mat-icon[mat-card-avatar] { font-size: 40px; height: 40px; width: 40px; color: #1976d2; }
    .coming-soon { color: #999; font-style: italic; }
  `]
})
export class ScholarshipDetailComponent {}
