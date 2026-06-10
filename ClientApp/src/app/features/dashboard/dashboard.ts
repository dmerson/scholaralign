import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="page">
      <h2>Dashboard</h2>
      <mat-card class="wizard-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>auto_awesome</mat-icon>
          <mat-card-title>Eligibility Wizard</mat-card-title>
          <mat-card-subtitle>Answer questions to discover scholarships you qualify for</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>The wizard will ask you a series of questions and automatically determine which scholarships you are eligible for. Your answers are saved so you can continue where you left off.</p>
          <p class="coming-soon">Wizard coming soon.</p>
        </mat-card-content>
        <mat-card-actions>
          <a mat-raised-button color="primary" routerLink="/scholarships">View My Scholarships</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    h2 { margin-bottom: 24px; }
    .wizard-card { max-width: 600px; }
    mat-icon[mat-card-avatar] { font-size: 40px; height: 40px; width: 40px; color: #1976d2; }
    .coming-soon { color: #999; font-style: italic; margin-top: 12px; }
  `]
})
export class DashboardComponent {}
