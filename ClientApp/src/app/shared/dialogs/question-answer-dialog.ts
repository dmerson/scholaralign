import { Component, inject, Inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Question } from '../../core/models/question.model';
import { EngineService } from '../../core/services/engine.service';

export interface QuestionAnswerDialogData {
  question: Question;
  currentAnswer: string | null;
  userEmail: string;
}

@Component({
  selector: 'app-question-answer-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
            MatSelectModule, MatRadioModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Answer Question</h2>
    <mat-dialog-content class="dialog-body">
      <p class="question-text">{{ data.question.questionDescription }}</p>

      @switch (data.question.questionTypeId) {
        @case (2) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your answer</mat-label>
            <input matInput type="number" step="1"
                   [ngModel]="answerText()" (ngModelChange)="setAnswerText($event)" />
          </mat-form-field>
        }
        @case (3) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your answer</mat-label>
            <input matInput type="number" step="any"
                   [ngModel]="answerText()" (ngModelChange)="setAnswerText($event)" />
          </mat-form-field>
        }
        @case (4) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Select all that apply</mat-label>
            <mat-select [multiple]="true"
                        [ngModel]="answerMulti()" (ngModelChange)="answerMulti.set($event)">
              @for (opt of listOptions(); track opt) {
                <mat-option [value]="opt">{{ opt }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (answerMulti().length) {
            <p class="multi-hint">Selected: {{ answerMulti().join(', ') }}</p>
          }
        }
        @case (5) {
          <mat-radio-group class="radio-group"
                           [ngModel]="answerText()" (ngModelChange)="answerText.set($event)">
            @for (opt of listOptions(); track opt) {
              <mat-radio-button [value]="opt">{{ opt }}</mat-radio-button>
            }
          </mat-radio-group>
        }
        @case (6) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Select one</mat-label>
            <mat-select [ngModel]="answerText()" (ngModelChange)="answerText.set($event)">
              @for (opt of listOptions(); track opt) {
                <mat-option [value]="opt">{{ opt }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
        @case (7) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Date</mat-label>
            <input matInput type="date"
                   [ngModel]="answerText()" (ngModelChange)="answerText.set($event)" />
          </mat-form-field>
        }
        @case (8) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Date &amp; Time</mat-label>
            <input matInput type="datetime-local"
                   [ngModel]="answerText()" (ngModelChange)="answerText.set($event)" />
          </mat-form-field>
        }
        @case (9) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Time</mat-label>
            <input matInput type="time"
                   [ngModel]="answerText()" (ngModelChange)="answerText.set($event)" />
          </mat-form-field>
        }
        @default {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your answer</mat-label>
            <input matInput [ngModel]="answerText()" (ngModelChange)="answerText.set($event)" />
          </mat-form-field>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary"
              [disabled]="!canSubmit() || saving()"
              (click)="save()">
        @if (saving()) { <mat-spinner diameter="18" /> }
        @else { Save }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-body { min-width: 380px; padding-top: 8px; }
    .question-text { font-size: 1rem; font-weight: 500; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .radio-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
    .multi-hint { font-size: 0.85rem; color: #555; margin-top: -4px; }
    mat-dialog-actions button mat-spinner { display: inline-block; margin-right: 4px; }
  `]
})
export class QuestionAnswerDialogComponent {
  private engineSvc = inject(EngineService);

  answerText  = signal('');
  answerMulti = signal<string[]>([]);
  saving      = signal(false);

  listOptions = computed<string[]>(() => {
    const attrs = this.data.question.questionTypeAttributes;
    if (!attrs) return [];
    try { return JSON.parse(attrs) as string[]; } catch { return []; }
  });

  canSubmit = computed(() => {
    if (this.data.question.questionTypeId === 4) return this.answerMulti().length > 0;
    return this.answerText().trim().length > 0;
  });

  constructor(
    private dialogRef: MatDialogRef<QuestionAnswerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuestionAnswerDialogData
  ) {
    const cur = data.currentAnswer;
    if (cur) {
      if (data.question.questionTypeId === 4) {
        try { this.answerMulti.set(JSON.parse(cur)); } catch { this.answerMulti.set([cur]); }
      } else {
        this.answerText.set(cur);
      }
    }
  }

  setAnswerText(v: unknown) {
    this.answerText.set(v == null ? '' : String(v));
  }

  save() {
    if (!this.canSubmit()) return;
    const value = this.data.question.questionTypeId === 4
      ? JSON.stringify(this.answerMulti())
      : this.answerText().trim();

    this.saving.set(true);
    this.engineSvc.saveAnswer(this.data.userEmail, this.data.question.questionId, value)
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: () => this.saving.set(false)
      });
  }
}
