import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { EngineService } from '../../core/services/engine.service';
import { ScholarshipSummary } from '../../core/models/dashboard.model';
import { Question } from '../../core/models/question.model';

@Component({
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatRadioModule, RouterLink
  ],
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

        <!-- ═══ WIZARD CARD (shown until all questions answered) ═══════ -->
        @if (questionLoading()) {
          <mat-card class="wizard-card">
            <mat-card-content class="wizard-loading">
              <mat-spinner diameter="32" />
              <span>Loading next question…</span>
            </mat-card-content>
          </mat-card>
        } @else if (currentQuestion()) {
          <mat-card class="wizard-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="wizard-icon">auto_awesome</mat-icon>
              <mat-card-title>Eligibility Wizard</mat-card-title>
              <mat-card-subtitle>
                Answer questions to determine which scholarships you qualify for.
                {{ unknown().length }} scholarship(s) still need more information.
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="wizard-body">
              <p class="question-text">{{ currentQuestion()!.questionDescription }}</p>

              @switch (currentQuestion()!.questionTypeId) {
                @case (1) {
                  <mat-form-field appearance="outline" class="answer-field">
                    <mat-label>Your answer</mat-label>
                    <input matInput [(ngModel)]="answerText" />
                  </mat-form-field>
                }
                @case (2) {
                  <mat-form-field appearance="outline" class="answer-field">
                    <mat-label>Your answer</mat-label>
                    <input matInput type="number" step="1" [(ngModel)]="answerText" />
                  </mat-form-field>
                }
                @case (3) {
                  <mat-form-field appearance="outline" class="answer-field">
                    <mat-label>Your answer</mat-label>
                    <input matInput type="number" step="any" [(ngModel)]="answerText" />
                  </mat-form-field>
                }
                @case (4) {
                  <mat-form-field appearance="outline" class="answer-field">
                    <mat-label>Select all that apply</mat-label>
                    <mat-select [(ngModel)]="answerMulti" [multiple]="true">
                      @for (opt of listOptions(); track opt) {
                        <mat-option [value]="opt">{{ opt }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  @if (answerMulti.length) {
                    <p class="multi-hint">Selected: {{ answerMulti.join(', ') }}</p>
                  }
                }
                @case (5) {
                  <mat-radio-group [(ngModel)]="answerText" class="radio-group">
                    @for (opt of listOptions(); track opt) {
                      <mat-radio-button [value]="opt">{{ opt }}</mat-radio-button>
                    }
                  </mat-radio-group>
                }
                @case (6) {
                  <mat-form-field appearance="outline" class="answer-field">
                    <mat-label>Select one</mat-label>
                    <mat-select [(ngModel)]="answerText">
                      @for (opt of listOptions(); track opt) {
                        <mat-option [value]="opt">{{ opt }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
                @case (7) {
                  <mat-form-field appearance="outline" class="answer-field">
                    <mat-label>Date</mat-label>
                    <input matInput type="date" [(ngModel)]="answerText" />
                  </mat-form-field>
                }
                @case (8) {
                  <mat-form-field appearance="outline" class="answer-field">
                    <mat-label>Date &amp; Time</mat-label>
                    <input matInput type="datetime-local" [(ngModel)]="answerText" />
                  </mat-form-field>
                }
                @case (9) {
                  <mat-form-field appearance="outline" class="answer-field">
                    <mat-label>Time</mat-label>
                    <input matInput type="time" [(ngModel)]="answerText" />
                  </mat-form-field>
                }
                @default {
                  <mat-form-field appearance="outline" class="answer-field">
                    <mat-label>Your answer</mat-label>
                    <input matInput [(ngModel)]="answerText" />
                  </mat-form-field>
                }
              }
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-raised-button color="primary"
                      [disabled]="!canSubmit() || answerSubmitting()"
                      (click)="submitAnswer()">
                @if (answerSubmitting()) { <mat-spinner diameter="18" /> }
                @else { Next <mat-icon>arrow_forward</mat-icon> }
              </button>
            </mat-card-actions>
          </mat-card>
        } @else {
          <mat-card class="wizard-done-card">
            <mat-card-content class="wizard-done">
              <mat-icon class="done-icon">check_circle</mat-icon>
              <div>
                <strong>Wizard complete!</strong>
                <p>All eligibility questions have been answered. Your results are shown below.</p>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- ═══ THREE-STACK TABS ══════════════════════════════════════ -->
        <mat-tab-group dynamicHeight class="results-tabs">

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon eligible-icon">check_circle</mat-icon>
              Eligible&nbsp;<span class="tab-badge eligible-badge">{{ eligible().length }}</span>
            </ng-template>
            <div class="tab-content">
              @if (eligible().length === 0) {
                <p class="empty-state">No eligible scholarships yet. Answer questions above to improve your results.</p>
              } @else {
                @for (s of eligible(); track s.scholarshipId) {
                  <mat-card class="schol-card eligible-card">
                    <mat-card-header>
                      <mat-icon mat-card-avatar class="eligible-icon">workspace_premium</mat-icon>
                      <mat-card-title>{{ s.scholarshipName }}</mat-card-title>
                      <mat-card-subtitle>{{ s.orgName }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      @if (s.amount || s.amountDescription) {
                        <p class="meta"><mat-icon inline>attach_money</mat-icon> {{ s.amountDescription || ('$' + s.amount) }}</p>
                      }
                      @if (s.startDate && s.endDate) {
                        <p class="meta"><mat-icon inline>event</mat-icon> {{ s.startDate.slice(0,10) }} – {{ s.endDate.slice(0,10) }}</p>
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
              Pending&nbsp;<span class="tab-badge unknown-badge">{{ unknown().length }}</span>
            </ng-template>
            <div class="tab-content">
              @if (unknown().length === 0) {
                <p class="empty-state">No pending scholarships.</p>
              } @else {
                <p class="hint">These scholarships are waiting for answers to remaining questions.</p>
                @for (s of unknown(); track s.scholarshipId) {
                  <mat-card class="schol-card unknown-card">
                    <mat-card-header>
                      <mat-icon mat-card-avatar class="unknown-icon">pending</mat-icon>
                      <mat-card-title>{{ s.scholarshipName }}</mat-card-title>
                      <mat-card-subtitle>{{ s.orgName }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      @if (s.amount || s.amountDescription) {
                        <p class="meta"><mat-icon inline>attach_money</mat-icon> {{ s.amountDescription || ('$' + s.amount) }}</p>
                      }
                      @if (s.startDate && s.endDate) {
                        <p class="meta"><mat-icon inline>event</mat-icon> {{ s.startDate.slice(0,10) }} – {{ s.endDate.slice(0,10) }}</p>
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
              Ineligible&nbsp;<span class="tab-badge ineligible-badge">{{ ineligible().length }}</span>
            </ng-template>
            <div class="tab-content">
              @if (ineligible().length === 0) {
                <p class="empty-state">No ineligible scholarships.</p>
              } @else {
                @for (s of ineligible(); track s.scholarshipId) {
                  <mat-card class="schol-card ineligible-card">
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
    .page { padding: 24px; max-width: 800px; }
    h2 { margin-bottom: 24px; }

    /* Sync spinner */
    .center-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 64px 24px; }
    .state-label { color: #555; font-size: 1rem; }

    /* Wizard card */
    .wizard-card { margin-bottom: 24px; border-left: 4px solid #1976d2; }
    .wizard-loading { display: flex; align-items: center; gap: 16px; padding: 16px 0; }
    .wizard-icon { color: #1976d2; font-size: 32px; height: 32px; width: 32px; }
    .wizard-body { padding-top: 12px; }
    .question-text { font-size: 1.05rem; font-weight: 500; margin-bottom: 16px; }
    .answer-field { width: 100%; max-width: 420px; }
    .radio-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
    .multi-hint { font-size: 0.85rem; color: #555; margin-top: -4px; margin-bottom: 8px; }
    mat-card-actions button mat-spinner { display: inline-block; margin-right: 6px; }

    /* Wizard done */
    .wizard-done-card { margin-bottom: 24px; border-left: 4px solid #388e3c; background: #f1f8e9; }
    .wizard-done { display: flex; align-items: center; gap: 16px; }
    .done-icon { font-size: 40px; height: 40px; width: 40px; color: #388e3c; }
    .wizard-done p { margin: 4px 0 0; color: #555; font-size: 0.9rem; }

    /* Info card */
    .info-card { max-width: 480px; }
    .info-card p { margin-bottom: 16px; }

    /* Tabs */
    .results-tabs { margin-top: 8px; }
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

    /* Scholarship cards */
    .tab-content { padding: 16px 0; display: flex; flex-direction: column; gap: 12px; }
    .schol-card { border-left: 4px solid #e0e0e0; }
    .eligible-card  { border-left-color: #388e3c; }
    .unknown-card   { border-left-color: #f57c00; }
    .ineligible-card { opacity: 0.65; }
    .meta { display: flex; align-items: center; gap: 4px; margin: 4px 0; font-size: 0.9rem; color: #555; }
    mat-icon[mat-card-avatar] { font-size: 32px; height: 32px; width: 32px; }

    .hint { color: #666; font-size: 0.9rem; font-style: italic; margin: 0 0 8px; }
    .empty-state { color: #999; font-style: italic; padding: 24px 0; }
  `]
})
export class DashboardComponent implements OnInit {
  private authSvc   = inject(AuthService);
  private engineSvc = inject(EngineService);

  syncing          = signal(true);
  questionLoading  = signal(false);
  answerSubmitting = signal(false);
  userEmail        = signal<string | null>(null);

  eligible   = signal<ScholarshipSummary[]>([]);
  unknown    = signal<ScholarshipSummary[]>([]);
  ineligible = signal<ScholarshipSummary[]>([]);

  currentQuestion = signal<Question | null>(null);

  // Bound to inputs — reset each time a new question loads
  answerText  = '';
  answerMulti: string[] = [];

  listOptions = computed<string[]>(() => {
    const attrs = this.currentQuestion()?.questionTypeAttributes;
    if (!attrs) return [];
    try { return JSON.parse(attrs) as string[]; } catch { return []; }
  });

  canSubmit = computed(() => {
    const q = this.currentQuestion();
    if (!q) return false;
    if (q.questionTypeId === 4) return this.answerMulti.length > 0;
    return this.answerText.trim().length > 0;
  });

  ngOnInit() {
    const email = this.authSvc.user()?.email ?? null;
    this.userEmail.set(email);
    if (!email) { this.syncing.set(false); return; }

    // Sync → load dashboard data → load first question in parallel with data
    this.engineSvc.sync(email).pipe(
      switchMap(() => this.engineSvc.getDashboard(email))
    ).subscribe({
      next: data => {
        this.eligible.set(data.eligible);
        this.unknown.set(data.unknown);
        this.ineligible.set(data.ineligible);
        this.syncing.set(false);
        this.loadNextQuestion();
      },
      error: () => this.syncing.set(false)
    });
  }

  loadNextQuestion() {
    const email = this.userEmail();
    if (!email) return;
    this.questionLoading.set(true);
    this.answerText  = '';
    this.answerMulti = [];
    this.engineSvc.getNextQuestion(email).subscribe({
      next: q => { this.currentQuestion.set(q); this.questionLoading.set(false); },
      error: ()  => { this.currentQuestion.set(null); this.questionLoading.set(false); }
    });
  }

  submitAnswer() {
    const email = this.userEmail();
    const q     = this.currentQuestion();
    if (!email || !q || !this.canSubmit()) return;

    const value = q.questionTypeId === 4
      ? JSON.stringify(this.answerMulti)
      : this.answerText.trim();

    this.answerSubmitting.set(true);
    this.engineSvc.saveAnswer(email, q.questionId, value).pipe(
      switchMap(() => this.engineSvc.getDashboard(email))
    ).subscribe({
      next: data => {
        this.eligible.set(data.eligible);
        this.unknown.set(data.unknown);
        this.ineligible.set(data.ineligible);
        this.answerSubmitting.set(false);
        this.loadNextQuestion();
      },
      error: () => this.answerSubmitting.set(false)
    });
  }
}
