import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { from, concatMap, defaultIfEmpty, last } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { UserApplicationService } from '../../core/services/user-application.service';
import { UserApplicationDetail, UserApplicationQuestion } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-application-detail',
  imports: [RouterLink, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
            MatFormFieldModule, MatInputModule, MatSelectModule, MatRadioModule,
            MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header">
        <a mat-button routerLink="/applications">
          <mat-icon>arrow_back</mat-icon> My Applications
        </a>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="48" /></div>
      } @else if (!detail()) {
        <mat-card><mat-card-content><p class="empty">Application not found.</p></mat-card-content></mat-card>
      } @else {
        <!-- Header card -->
        <mat-card class="header-card" [class.submitted-card]="detail()!.isSubmitted">
          <mat-card-header>
            <mat-icon mat-card-avatar [class]="detail()!.isSubmitted ? 'icon-done' : 'icon-active'">
              {{ detail()!.isSubmitted ? 'check_circle' : 'assignment' }}
            </mat-icon>
            <mat-card-title>{{ detail()!.scholarshipName }}</mat-card-title>
            <mat-card-subtitle>{{ detail()!.applicationName }}</mat-card-subtitle>
          </mat-card-header>
          @if (detail()!.isSubmitted) {
            <mat-card-content>
              <div class="submitted-banner">
                <mat-icon>verified</mat-icon>
                <span>Submitted on {{ detail()!.submittedDate?.slice(0,10) }}. Your answers are now read-only.</span>
              </div>
            </mat-card-content>
          }
        </mat-card>

        <!-- Questions -->
        @if (detail()!.questions.length === 0) {
          <mat-card class="no-q-card">
            <mat-card-content>
              <p class="empty">This application has no questions configured yet.</p>
            </mat-card-content>
          </mat-card>
        } @else {
          @for (q of detail()!.questions; track q.applicationQuestionId; let i = $index) {
            <mat-card class="q-card">
              <mat-card-content>
                <p class="q-num">Question {{ i + 1 }}</p>
                <p class="q-label">{{ q.questionDescription }}</p>

                @switch (q.questionTypeId) {
                  @case (2) {
                    <mat-form-field appearance="outline" class="answer-field">
                      <mat-label>Your answer</mat-label>
                      <input matInput type="number" step="1"
                             [disabled]="detail()!.isSubmitted"
                             [ngModel]="textAnswers()[q.applicationQuestionId]"
                             (ngModelChange)="setTextAnswer(q.applicationQuestionId, $event)" />
                    </mat-form-field>
                  }
                  @case (3) {
                    <mat-form-field appearance="outline" class="answer-field">
                      <mat-label>Your answer</mat-label>
                      <input matInput type="number" step="any"
                             [disabled]="detail()!.isSubmitted"
                             [ngModel]="textAnswers()[q.applicationQuestionId]"
                             (ngModelChange)="setTextAnswer(q.applicationQuestionId, $event)" />
                    </mat-form-field>
                  }
                  @case (4) {
                    <mat-form-field appearance="outline" class="answer-field">
                      <mat-label>Select all that apply</mat-label>
                      <mat-select [multiple]="true"
                                  [disabled]="detail()!.isSubmitted"
                                  [ngModel]="multiAnswers()[q.applicationQuestionId]"
                                  (ngModelChange)="setMultiAnswer(q.applicationQuestionId, $event)">
                        @for (opt of listOptions(q); track opt) {
                          <mat-option [value]="opt">{{ opt }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  }
                  @case (5) {
                    <mat-radio-group class="radio-group"
                                     [disabled]="detail()!.isSubmitted"
                                     [ngModel]="textAnswers()[q.applicationQuestionId]"
                                     (ngModelChange)="setTextAnswer(q.applicationQuestionId, $event)">
                      @for (opt of listOptions(q); track opt) {
                        <mat-radio-button [value]="opt">{{ opt }}</mat-radio-button>
                      }
                    </mat-radio-group>
                  }
                  @case (6) {
                    <mat-form-field appearance="outline" class="answer-field">
                      <mat-label>Select one</mat-label>
                      <mat-select [disabled]="detail()!.isSubmitted"
                                  [ngModel]="textAnswers()[q.applicationQuestionId]"
                                  (ngModelChange)="setTextAnswer(q.applicationQuestionId, $event)">
                        @for (opt of listOptions(q); track opt) {
                          <mat-option [value]="opt">{{ opt }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  }
                  @case (7) {
                    <mat-form-field appearance="outline" class="answer-field">
                      <mat-label>Date</mat-label>
                      <input matInput type="date"
                             [disabled]="detail()!.isSubmitted"
                             [ngModel]="textAnswers()[q.applicationQuestionId]"
                             (ngModelChange)="setTextAnswer(q.applicationQuestionId, $event)" />
                    </mat-form-field>
                  }
                  @case (8) {
                    <mat-form-field appearance="outline" class="answer-field">
                      <mat-label>Date &amp; Time</mat-label>
                      <input matInput type="datetime-local"
                             [disabled]="detail()!.isSubmitted"
                             [ngModel]="textAnswers()[q.applicationQuestionId]"
                             (ngModelChange)="setTextAnswer(q.applicationQuestionId, $event)" />
                    </mat-form-field>
                  }
                  @case (9) {
                    <mat-form-field appearance="outline" class="answer-field">
                      <mat-label>Time</mat-label>
                      <input matInput type="time"
                             [disabled]="detail()!.isSubmitted"
                             [ngModel]="textAnswers()[q.applicationQuestionId]"
                             (ngModelChange)="setTextAnswer(q.applicationQuestionId, $event)" />
                    </mat-form-field>
                  }
                  @default {
                    <mat-form-field appearance="outline" class="answer-field">
                      <mat-label>Your answer</mat-label>
                      <textarea matInput rows="3"
                                [disabled]="detail()!.isSubmitted"
                                [ngModel]="textAnswers()[q.applicationQuestionId]"
                                (ngModelChange)="setTextAnswer(q.applicationQuestionId, $event)"></textarea>
                    </mat-form-field>
                  }
                }
              </mat-card-content>
            </mat-card>
          }

          @if (!detail()!.isSubmitted) {
            <div class="action-bar">
              <button mat-stroked-button [disabled]="saving()" (click)="saveDraft()">
                @if (saving()) { <mat-spinner diameter="18" /> }
                @else { <mat-icon>save</mat-icon> }
                Save Draft
              </button>
              <button mat-raised-button color="primary" [disabled]="saving() || submitting()" (click)="submitApplication()">
                @if (submitting()) { <mat-spinner diameter="18" /> }
                @else { <mat-icon>send</mat-icon> }
                Submit Application
              </button>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 780px; }
    .page-header { margin-bottom: 16px; }
    .center { display: flex; justify-content: center; padding: 64px; }
    .empty { color: #888; font-style: italic; }

    .header-card { margin-bottom: 20px; border-left: 4px solid #1976d2; }
    .submitted-card { border-left-color: #388e3c; }
    mat-icon[mat-card-avatar] { font-size: 32px; height: 32px; width: 32px; }
    .icon-done   { color: #388e3c; }
    .icon-active { color: #1976d2; }

    .submitted-banner { display: flex; align-items: center; gap: 10px; color: #388e3c;
                        background: #f1f8e9; border-radius: 6px; padding: 10px 14px; }
    .submitted-banner mat-icon { flex-shrink: 0; }

    .no-q-card { margin-bottom: 16px; }
    .q-card { margin-bottom: 14px; }
    .q-num { font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
             letter-spacing: .05em; color: #888; margin: 0 0 4px; }
    .q-label { font-size: 1rem; font-weight: 500; margin: 0 0 14px; }
    .answer-field { width: 100%; }
    .radio-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }

    .action-bar { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; padding: 16px 0; }
    .action-bar button mat-spinner { display: inline-block; margin-right: 4px; }
  `]
})
export class ApplicationDetailComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  private authSvc    = inject(AuthService);
  private userAppSvc = inject(UserApplicationService);
  private snack      = inject(MatSnackBar);

  scholarshipId = '';
  detail      = signal<UserApplicationDetail | null>(null);
  loading     = signal(true);
  saving      = signal(false);
  submitting  = signal(false);

  textAnswers  = signal<Record<string, string>>({});
  multiAnswers = signal<Record<string, string[]>>({});

  ngOnInit() {
    this.scholarshipId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  load() {
    const email = this.authSvc.user()?.email;
    if (!email || !this.scholarshipId) { this.loading.set(false); return; }

    this.loading.set(true);
    this.userAppSvc.getDetail(email, this.scholarshipId).subscribe({
      next: d => {
        this.detail.set(d);
        this.initAnswers(d.questions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private initAnswers(questions: UserApplicationQuestion[]) {
    const textMap:  Record<string, string>   = {};
    const multiMap: Record<string, string[]> = {};
    for (const q of questions) {
      if (q.questionTypeId === 4) {
        try { multiMap[q.applicationQuestionId] = JSON.parse(q.answerValue ?? '[]'); }
        catch { multiMap[q.applicationQuestionId] = []; }
      } else {
        textMap[q.applicationQuestionId] = q.answerValue ?? '';
      }
    }
    this.textAnswers.set(textMap);
    this.multiAnswers.set(multiMap);
  }

  setTextAnswer(aqId: string, val: unknown) {
    this.textAnswers.update(m => ({ ...m, [aqId]: val == null ? '' : String(val) }));
  }

  setMultiAnswer(aqId: string, val: string[]) {
    this.multiAnswers.update(m => ({ ...m, [aqId]: val }));
  }

  listOptions(q: UserApplicationQuestion): string[] {
    if (!q.questionTypeAttributes) return [];
    try { return JSON.parse(q.questionTypeAttributes); } catch { return []; }
  }

  private buildAnswerValue(q: UserApplicationQuestion): string {
    if (q.questionTypeId === 4) return JSON.stringify(this.multiAnswers()[q.applicationQuestionId] ?? []);
    return this.textAnswers()[q.applicationQuestionId]?.trim() ?? '';
  }

  saveDraft() {
    const email = this.authSvc.user()?.email;
    const d     = this.detail();
    if (!email || !d) return;

    const toSave = d.questions
      .map(q => ({ aqId: q.applicationQuestionId, val: this.buildAnswerValue(q) }))
      .filter(x => x.val.length > 0 && x.val !== '[]');

    if (toSave.length === 0) {
      this.snack.open('Nothing to save yet.', '', { duration: 2000 });
      return;
    }

    this.saving.set(true);
    from(toSave).pipe(
      concatMap(x => this.userAppSvc.saveAnswer(email, this.scholarshipId, x.aqId, x.val))
    ).subscribe({
      error:    () => { this.saving.set(false); this.snack.open('Save failed.', 'Close', { duration: 3000 }); },
      complete: () => { this.saving.set(false); this.snack.open('Draft saved.', '', { duration: 2500 }); }
    });
  }

  submitApplication() {
    if (!confirm('Submit your application? You will not be able to make changes after submitting.')) return;
    const email = this.authSvc.user()?.email;
    const d     = this.detail();
    if (!email || !d) return;

    this.submitting.set(true);
    const toSave = d.questions
      .map(q => ({ aqId: q.applicationQuestionId, val: this.buildAnswerValue(q) }))
      .filter(x => x.val.length > 0 && x.val !== '[]');

    from(toSave).pipe(
      concatMap(x => this.userAppSvc.saveAnswer(email, this.scholarshipId, x.aqId, x.val)),
      defaultIfEmpty(null),
      last(),
      concatMap(() => this.userAppSvc.submit(email, this.scholarshipId))
    ).subscribe({
      next:  () => { this.submitting.set(false); this.load(); },
      error: () => { this.submitting.set(false); this.snack.open('Submit failed.', 'Close', { duration: 3000 }); }
    });
  }
}
