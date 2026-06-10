import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/services/auth.service';
import { UserApplicationService } from '../../core/services/user-application.service';
import { EngineService } from '../../core/services/engine.service';
import { UserApplicationSummary } from '../../core/models/dashboard.model';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-application-list',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule,
            MatChipsModule, MatProgressSpinnerModule, MatProgressBarModule],
  template: `
    <div class="page">
      <h2>My Applications</h2>
      <p class="hint">
        Scholarship applications you are eligible to fill out. Complete and submit each application to be considered.
      </p>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="48" /></div>
      } @else if (apps().length === 0) {
        <mat-card class="empty-card">
          <mat-card-content class="empty-body">
            <mat-icon class="empty-icon">assignment_turned_in</mat-icon>
            <div>
              <strong>No applications available yet.</strong>
              <p>Once you are marked eligible for a scholarship that has an application form, it will appear here.</p>
              <a mat-stroked-button routerLink="/dashboard">Go to Dashboard</a>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="cards-grid">
          @for (app of apps(); track app.scholarshipId) {
            <mat-card class="app-card" [class.submitted-card]="app.isSubmitted">
              <mat-card-header>
                <mat-icon mat-card-avatar [class]="statusIconClass(app)">{{ statusIcon(app) }}</mat-icon>
                <mat-card-title>{{ app.scholarshipName }}</mat-card-title>
                <mat-card-subtitle>{{ app.orgName }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="meta-row">
                  @if (app.amount || app.amountDescription) {
                    <span class="chip"><mat-icon inline>attach_money</mat-icon>
                      {{ app.amountDescription || ('$' + app.amount) }}</span>
                  }
                  @if (app.startDate && app.endDate) {
                    <span class="chip"><mat-icon inline>event</mat-icon>
                      {{ app.startDate.slice(0,10) }} – {{ app.endDate.slice(0,10) }}</span>
                  }
                </div>

                <div class="app-name">
                  <mat-icon class="app-name-icon">assignment</mat-icon>
                  {{ app.applicationName }}
                </div>

                <div class="progress-row">
                  <mat-chip [color]="statusColor(app)" highlighted>{{ statusLabel(app) }}</mat-chip>
                  @if (!app.isSubmitted) {
                    <span class="q-count">{{ app.questionCount }} question{{ app.questionCount !== 1 ? 's' : '' }}</span>
                  }
                  @if (app.isSubmitted && app.submittedDate) {
                    <span class="submitted-on">Submitted {{ app.submittedDate.slice(0,10) }}</span>
                  }
                </div>
              </mat-card-content>
              <mat-card-actions>
                <a mat-raised-button [color]="app.isSubmitted ? undefined : 'primary'"
                   [routerLink]="['/applications', app.scholarshipId]">
                  <mat-icon>{{ app.isSubmitted ? 'visibility' : (app.isStarted ? 'edit' : 'play_arrow') }}</mat-icon>
                  {{ app.isSubmitted ? 'View Submission' : (app.isStarted ? 'Continue' : 'Start Application') }}
                </a>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 960px; }
    h2 { margin-bottom: 8px; }
    .hint { color: #666; font-size: 0.9rem; margin-bottom: 24px; }
    .center { display: flex; justify-content: center; padding: 64px; }

    .empty-card { max-width: 520px; }
    .empty-body { display: flex; align-items: flex-start; gap: 16px; padding: 8px 0; }
    .empty-icon { font-size: 48px; height: 48px; width: 48px; color: #bbb; flex-shrink: 0; }
    .empty-body p { margin: 8px 0 16px; color: #666; }

    .cards-grid { display: flex; flex-direction: column; gap: 16px; }
    .app-card { border-left: 4px solid #1976d2; }
    .submitted-card { border-left-color: #388e3c; opacity: 0.9; }

    mat-icon[mat-card-avatar] { font-size: 32px; height: 32px; width: 32px; }
    .icon-active    { color: #1976d2; }
    .icon-done      { color: #388e3c; }
    .icon-pending   { color: #f57c00; }

    .meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .chip { display: inline-flex; align-items: center; gap: 4px; background: #f5f5f5;
            border-radius: 14px; padding: 3px 10px; font-size: 0.83rem; color: #555; }

    .app-name { display: flex; align-items: center; gap: 6px; font-weight: 500; margin-bottom: 10px; color: #333; }
    .app-name-icon { font-size: 18px; height: 18px; width: 18px; color: #888; }

    .progress-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .q-count { font-size: 0.85rem; color: #888; }
    .submitted-on { font-size: 0.85rem; color: #388e3c; }
  `]
})
export class ApplicationListComponent implements OnInit {
  private authSvc    = inject(AuthService);
  private userAppSvc = inject(UserApplicationService);
  private engineSvc  = inject(EngineService);

  apps    = signal<UserApplicationSummary[]>([]);
  loading = signal(true);

  ngOnInit() {
    const email = this.authSvc.user()?.email;
    if (!email) { this.loading.set(false); return; }

    this.engineSvc.sync(email).pipe(
      switchMap(() => this.userAppSvc.getMyApplications(email))
    ).subscribe({
      next: d => { this.apps.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  statusLabel(app: UserApplicationSummary) {
    if (app.isSubmitted) return 'Submitted';
    if (app.isStarted)   return 'In Progress';
    return 'Not Started';
  }

  statusColor(app: UserApplicationSummary): 'primary' | 'accent' | 'warn' | undefined {
    if (app.isSubmitted) return 'primary';
    if (app.isStarted)   return 'accent';
    return undefined;
  }

  statusIcon(app: UserApplicationSummary) {
    if (app.isSubmitted) return 'check_circle';
    if (app.isStarted)   return 'edit_note';
    return 'assignment';
  }

  statusIconClass(app: UserApplicationSummary) {
    if (app.isSubmitted) return 'icon-done';
    if (app.isStarted)   return 'icon-active';
    return 'icon-pending';
  }
}
