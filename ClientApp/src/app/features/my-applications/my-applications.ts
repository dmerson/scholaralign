import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ApplicationService } from '../../core/services/application.service';
import { ScholarshipApplication } from '../../core/models/application.model';

@Component({
  selector: 'app-my-applications',
  imports: [RouterLink, MatCardModule, MatChipsModule, MatButtonModule, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  template: `
    <h2>My Applications</h2>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else {
      @if (applications().length === 0) {
        <div class="empty">
          <p>You haven't applied to any scholarships yet.</p>
          <a mat-raised-button color="primary" routerLink="/scholarships">Browse Scholarships</a>
        </div>
      } @else {
        <div class="list">
          @for (app of applications(); track app.id) {
            <mat-card>
              <mat-card-header>
                <mat-card-title>{{ app.scholarship.title }}</mat-card-title>
                <mat-card-subtitle>{{ app.scholarship.organization.name }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="meta">
                  <span>{{ app.scholarship.amount | currency }}</span>
                  <mat-chip-set>
                    <mat-chip [class]="'status-' + app.status.toLowerCase()">{{ app.status }}</mat-chip>
                  </mat-chip-set>
                </div>
                <p class="date">Applied: {{ app.submittedAt | date:'mediumDate' }}</p>
                @if (app.reviewNotes) {
                  <p class="notes"><strong>Review notes:</strong> {{ app.reviewNotes }}</p>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    }
  `,
  styles: [`
    h2 { margin-bottom: 24px; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .empty { text-align: center; padding: 48px; p { margin-bottom: 16px; } }
    .list { display: flex; flex-direction: column; gap: 16px; max-width: 800px; }
    .meta { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
    .date { color: #666; font-size: 0.9rem; }
    .notes { margin-top: 8px; font-style: italic; }
    .status-accepted { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background: #ffebee !important; color: #c62828 !important; }
    .status-underreview { background: #e3f2fd !important; color: #1565c0 !important; }
    .status-submitted { background: #f3e5f5 !important; color: #6a1b9a !important; }
  `]
})
export class MyApplicationsComponent implements OnInit {
  applications = signal<ScholarshipApplication[]>([]);
  loading = signal(true);

  constructor(private svc: ApplicationService) {}

  ngOnInit() {
    this.svc.getMyApplications().subscribe({
      next: data => { this.applications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
