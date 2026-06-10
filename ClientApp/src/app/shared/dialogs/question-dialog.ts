import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Question, QuestionType } from '../../core/models/question.model';
import { QuestionService } from '../../core/services/question.service';

export interface QuestionDialogData {
  question: Question | null;
  types: QuestionType[];
}

@Component({
  selector: 'app-question-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.question ? 'Edit' : 'Add' }} Question</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Question Text</mat-label>
          <textarea matInput formControlName="questionDescription" rows="3" maxlength="1000"></textarea>
          @if (form.get('questionDescription')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Type</mat-label>
          <mat-select formControlName="questionTypeId">
            @for (t of data.types; track t.questionTypeId) {
              <mat-option [value]="t.questionTypeId">{{ t.questionTypeDescription }}</mat-option>
            }
          </mat-select>
          @if (form.get('questionTypeId')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Wizard Order (optional — lower numbers asked first)</mat-label>
          <input matInput type="number" formControlName="questionOrder" min="1">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || saving" (click)="save()">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 420px; padding-top: 8px; } .full-width { width: 100%; }`]
})
export class QuestionDialogComponent {
  private svc = inject(QuestionService);
  private fb = inject(FormBuilder);
  form!: ReturnType<FormBuilder['group']>;
  saving = false;

  constructor(
    private dialogRef: MatDialogRef<QuestionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuestionDialogData
  ) {
    this.form = this.fb.group({
      questionDescription: [data.question?.questionDescription ?? '', [Validators.required, Validators.maxLength(1000)]],
      questionTypeId: [data.question?.questionTypeId ?? null, Validators.required],
      questionOrder: [data.question?.questionOrder ?? null]
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const val = this.form.value;
    const obs = this.data.question
      ? this.svc.update(this.data.question.questionId, val)
      : this.svc.create(val);
    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.saving = false; }
    });
  }
}
