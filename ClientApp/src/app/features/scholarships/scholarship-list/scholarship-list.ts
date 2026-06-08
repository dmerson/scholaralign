import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { ScholarshipService } from '../../../core/services/scholarship.service';
import { Scholarship } from '../../../core/models/scholarship.model';

@Component({
  selector: 'app-scholarship-list',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatChipsModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe, SlicePipe],
  template: `
    <h2>Available Scholarships</h2>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else {
      <div class="grid">
        @for (s of scholarships(); track s.id) {
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ s.title }}</mat-card-title>
              <mat-card-subtitle>{{ s.organization.name }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="amount">{{ s.amount | currency }}</p>
              <p class="deadline">Deadline: {{ s.deadline | date:'mediumDate' }}</p>
              <p class="desc">{{ s.description | slice:0:150 }}{{ s.description.length > 150 ? '...' : '' }}</p>
              <mat-chip-set>
                <mat-chip [class]="'status-' + s.status.toLowerCase()">{{ s.status }}</mat-chip>
              </mat-chip-set>
            </mat-card-content>
            <mat-card-actions>
              <a mat-button color="primary" [routerLink]="['/scholarships', s.id]">View Details</a>
            </mat-card-actions>
          </mat-card>
        } @empty {
          <p>No scholarships available at this time.</p>
        }
      </div>
    }
  `,
  styles: [`
    h2 { margin-bottom: 24px; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .amount { font-size: 1.5rem; font-weight: 700; color: #1976d2; margin: 8px 0; }
    .deadline { color: #666; font-size: 0.9rem; }
    .desc { margin: 12px 0; }
    .status-active { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-closed { background: #ffebee !important; color: #c62828 !important; }
    .status-draft { background: #fff3e0 !important; color: #e65100 !important; }
  `]
})
export class ScholarshipListComponent implements OnInit {
  scholarships = signal<Scholarship[]>([]);
  loading = signal(true);

  constructor(private svc: ScholarshipService) {}

  ngOnInit() {
    this.svc.getAll('Active').subscribe({
      next: data => { this.scholarships.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
