import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ScholarshipService } from '../../../core/services/scholarship.service';
import { Scholarship } from '../../../core/models/scholarship.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-scholarship-detail',
  imports: [RouterLink, MatButtonModule, MatChipsModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  template: `
    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else if (scholarship()) {
      <div class="detail">
        <h2>{{ scholarship()!.title }}</h2>
        <p class="org">{{ scholarship()!.organization.name }}</p>

        <div class="meta">
          <span class="amount">{{ scholarship()!.amount | currency }}</span>
          <span class="deadline">Deadline: {{ scholarship()!.deadline | date:'longDate' }}</span>
          <mat-chip-set>
            <mat-chip>{{ scholarship()!.status }}</mat-chip>
          </mat-chip-set>
        </div>

        <section>
          <h3>Description</h3>
          <p>{{ scholarship()!.description }}</p>
        </section>

        @if (scholarship()!.eligibilityCriteria) {
          <section>
            <h3>Eligibility Criteria</h3>
            <p>{{ scholarship()!.eligibilityCriteria }}</p>
          </section>
        }

        <div class="actions">
          @if (scholarship()!.status === 'Active') {
            @if (auth.isAuthenticated()) {
              <a mat-raised-button color="primary" [routerLink]="['/apply', scholarship()!.id]">Apply Now</a>
            } @else {
              <a mat-raised-button color="primary" routerLink="/login">Sign In to Apply</a>
            }
          }
          <a mat-button routerLink="/scholarships">Back to Scholarships</a>
        </div>
      </div>
    } @else {
      <p>Scholarship not found.</p>
    }
  `,
  styles: [`
    .center { display: flex; justify-content: center; padding: 48px; }
    .detail { max-width: 800px; }
    h2 { font-size: 2rem; margin-bottom: 8px; }
    .org { color: #666; font-size: 1.1rem; margin-bottom: 16px; }
    .meta { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; margin-bottom: 32px; }
    .amount { font-size: 1.5rem; font-weight: 700; color: #1976d2; }
    .deadline { color: #555; }
    section { margin-bottom: 24px; h3 { margin-bottom: 8px; } }
    .actions { display: flex; gap: 12px; margin-top: 32px; }
  `]
})
export class ScholarshipDetailComponent implements OnInit {
  scholarship = signal<Scholarship | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private svc: ScholarshipService,
    readonly auth: AuthService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getById(id).subscribe({
      next: data => { this.scholarship.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
