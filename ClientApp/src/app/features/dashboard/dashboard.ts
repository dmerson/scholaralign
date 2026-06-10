import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EngineService } from '../../core/services/engine.service';
import { ScholarshipSummary } from '../../core/models/dashboard.model';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTabsModule, MatProgressSpinnerModule, MatChipsModule, RouterLink],
  template: `
    <div class="page">
      <h2>My Scholarships</h2>

      @if (syncing()) {
        <div class="center-state">
          <mat-spinner diameter="48" />
          <p class="state-label">Checking your scholarship eligibility…</p>
        </div>
      } @else if (!userEmail()) {
        <mat-card class="info-card">
          <mat-card-content>
            <p>You must be logged in to view your scholarships.</p>
            <a mat-raised-button color="primary" routerLink="/login">Log In</a>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-tab-group dynamicHeight>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon eligible-icon">check_circle</mat-icon>
              Eligible&nbsp;
              <span class="tab-badge eligible-badge">{{ eligible().length }}</span>
            </ng-template>
            <div class="tab-content">
              @if (eligible().length === 0) {
                <p class="empty-state">No eligible scholarships found yet. Answer more questions to improve your results.</p>
              } @else {
                @for (s of eligible(); track s.scholarshipId) {
                  <mat-card class="scholarship-card">
                    <mat-card-header>
                      <mat-icon mat-card-avatar class="eligible-icon">workspace_premium</mat-icon>
                      <mat-card-title>{{ s.scholarshipName }}</mat-card-title>
                      <mat-card-subtitle>{{ s.orgName }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      @if (s.amount || s.amountDescription) {
                        <p class="amount"><mat-icon inline>attach_money</mat-icon> {{ s.amountDescription || ('$' + s.amount) }}</p>
                      }
                      @if (s.startDate && s.endDate) {
                        <p class="dates"><mat-icon inline>event</mat-icon> {{ s.startDate | slice:0:10 }} – {{ s.endDate | slice:0:10 }}</p>
                      }
                    </mat-card-content>
                  </mat-card>
                }
              }
            </div>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon unknown-icon">help_outline</mat-icon>
              Pending&nbsp;
              <span class="tab-badge unknown-badge">{{ unknown().length }}</span>
            </ng-template>
            <div class="tab-content">
              @if (unknown().length === 0) {
                <p class="empty-state">No pending scholarships. The wizard has all the answers it needs.</p>
              } @else {
                <p class="hint">These scholarships need more answers before eligibility can be determined.</p>
                @for (s of unknown(); track s.scholarshipId) {
                  <mat-card class="scholarship-card">
                    <mat-card-header>
                      <mat-icon mat-card-avatar class="unknown-icon">pending</mat-icon>
                      <mat-card-title>{{ s.scholarshipName }}</mat-card-title>
                      <mat-card-subtitle>{{ s.orgName }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      @if (s.amount || s.amountDescription) {
                        <p class="amount"><mat-icon inline>attach_money</mat-icon> {{ s.amountDescription || ('$' + s.amount) }}</p>
                      }
                      @if (s.startDate && s.endDate) {
                        <p class="dates"><mat-icon inline>event</mat-icon> {{ s.startDate | slice:0:10 }} – {{ s.endDate | slice:0:10 }}</p>
                      }
                    </mat-card-content>
                  </mat-card>
                }
              }
            </div>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon ineligible-icon">cancel</mat-icon>
              Ineligible&nbsp;
              <span class="tab-badge ineligible-badge">{{ ineligible().length }}</span>
            </ng-template>
            <div class="tab-content">
              @if (ineligible().length === 0) {
                <p class="empty-state">No ineligible scholarships.</p>
              } @else {
                @for (s of ineligible(); track s.scholarshipId) {
                  <mat-card class="scholarship-card ineligible-card">
                    <mat-card-header>
                      <mat-icon mat-card-avatar class="ineligible-icon">block</mat-icon>
                      <mat-card-title>{{ s.scholarshipName }}</mat-card-title>
                      <mat-card-subtitle>{{ s.orgName }}</mat-card-subtitle>
                    </mat-card-header>
                  </mat-card>
                }
              }
            </div>
          </mat-tab>

        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    h2 { margin-bottom: 24px; }
    .center-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 64px 24px; }
    .state-label { color: #555; font-size: 1rem; }
    .info-card { max-width: 480px; }
    .info-card p { margin-bottom: 16px; }
    .tab-icon { vertical-align: middle; font-size: 18px; height: 18px; width: 18px; margin-right: 4px; }
    .eligible-icon { color: #388e3c; }
    .unknown-icon { color: #f57c00; }
    .ineligible-icon { color: #9e9e9e; }
    .tab-badge { display: inline-flex; align-items: center; justify-content: center;
                 min-width: 20px; height: 20px; border-radius: 10px; padding: 0 5px;
                 font-size: 0.75rem; font-weight: 600; }
    .eligible-badge   { background: #e8f5e9; color: #388e3c; }
    .unknown-badge    { background: #fff3e0; color: #f57c00; }
    .ineligible-badge { background: #f5f5f5; color: #757575; }
    .tab-content { padding: 16px 0; display: flex; flex-direction: column; gap: 12px; max-width: 720px; }
    .scholarship-card { border-left: 4px solid #388e3c; }
    .ineligible-card { border-left: 4px solid #e0e0e0; opacity: 0.75; }
    .amount, .dates { display: flex; align-items: center; gap: 4px; margin: 4px 0; font-size: 0.9rem; color: #555; }
    .hint { color: #666; font-size: 0.9rem; font-style: italic; margin: 0 0 8px; }
    .empty-state { color: #999; font-style: italic; padding: 24px 0; }
    mat-icon[mat-card-avatar] { font-size: 32px; height: 32px; width: 32px; }
  `]
})
export class DashboardComponent implements OnInit {
  private authSvc = inject(AuthService);
  private engineSvc = inject(EngineService);

  syncing = signal(true);
  userEmail = signal<string | null>(null);
  eligible   = signal<ScholarshipSummary[]>([]);
  unknown    = signal<ScholarshipSummary[]>([]);
  ineligible = signal<ScholarshipSummary[]>([]);

  ngOnInit() {
    const email = this.authSvc.user()?.email ?? null;
    this.userEmail.set(email);

    if (!email) { this.syncing.set(false); return; }

    this.engineSvc.sync(email).pipe(
      switchMap(() => this.engineSvc.getDashboard(email))
    ).subscribe({
      next: data => {
        this.eligible.set(data.eligible);
        this.unknown.set(data.unknown);
        this.ineligible.set(data.ineligible);
        this.syncing.set(false);
      },
      error: () => this.syncing.set(false)
    });
  }
}
