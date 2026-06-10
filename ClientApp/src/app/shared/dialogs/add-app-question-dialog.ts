import { Component, inject, Inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Question } from '../../core/models/question.model';
import { AdminApplicationService } from '../../core/services/admin-application.service';

export interface AddAppQuestionDialogData {
  applicationId: string;
  availableQuestions: Question[];
  nextOrder: number;
}

@Component({
  selector: 'app-add-app-question-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
            MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Add Question</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        @if (data.availableQuestions.length === 0) {
          <p class="none-msg">All questions have already been added to this application.</p>
        } @else {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Question</mat-label>
            <mat-select formControlName="questionId">
              @for (q of data.availableQuestions; track q.questionId) {
                <mat-option [value]="q.questionId">
                  {{ q.questionDescription }}
                  <span class="type-hint"> ({{ q.questionTypeName }})</span>
                </mat-option>
              }
            </mat-select>
            @if (form.get('questionId')?.hasError('required')) {
              <mat-error>Please select a question</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Order</mat-label>
            <input matInput type="number" formControlName="order" min="1" step="10" />
            <mat-hint>Lower numbers appear first</mat-hint>
            @if (form.get('order')?.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      @if (data.availableQuestions.length > 0) {
        <button mat-raised-button color="primary"
                [disabled]="form.invalid || saving()"
                (click)="save()">
          @if (saving()) { <mat-spinner diameter="18" /> }
          @else { Add }
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 420px; padding-top: 8px; }
    .full-width { width: 100%; }
    .half-width { width: 50%; }
    .type-hint { font-size: 0.8rem; color: #888; }
    .none-msg { color: #888; font-style: italic; padding: 8px 0; }
    mat-dialog-actions button mat-spinner { display: inline-block; margin-right: 4px; }
  `]
})
export class AddAppQuestionDialogComponent {
  private svc = inject(AdminApplicationService);
  private fb  = inject(FormBuilder);

  saving = signal(false);
  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private dialogRef: MatDialogRef<AddAppQuestionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddAppQuestionDialogData
  ) {
    this.form = this.fb.group({
      questionId: [null as string | null, Validators.required],
      order:      [data.nextOrder, [Validators.required, Validators.min(1)]]
    });
  }

  save() {
    if (this.form.invalid) return;
    const { questionId, order } = this.form.value;
    this.saving.set(true);
    this.svc.addQuestion(this.data.applicationId, questionId!, order!).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.saving.set(false)
    });
  }
}
