import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Requirement, Operator } from '../../core/models/requirement.model';
import { Question } from '../../core/models/question.model';
import { RequirementService } from '../../core/services/requirement.service';

export interface RequirementDialogData {
  requirement: Requirement | null;
  scholarshipId: string;
  questions: Question[];
  operators: Operator[];
}

const LIST_TYPE_IDS = [4, 5, 6];

@Component({
  selector: 'app-requirement-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.requirement ? 'Edit' : 'Add' }} Requirement</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Question</mat-label>
          <mat-select formControlName="questionId">
            @for (q of data.questions; track q.questionId) {
              <mat-option [value]="q.questionId">{{ q.questionDescription }}</mat-option>
            }
          </mat-select>
          @if (form.get('questionId')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Operator</mat-label>
          <mat-select formControlName="operatorId">
            @for (o of data.operators; track o.operatorId) {
              <mat-option [value]="o.operatorId">{{ o.operatorShownName }}</mat-option>
            }
          </mat-select>
          @if (form.get('operatorId')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>

        @if (isListQuestion()) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Value</mat-label>
            <mat-select formControlName="requirementValue">
              @for (item of listItems(); track item) {
                <mat-option [value]="item">{{ item }}</mat-option>
              }
            </mat-select>
            @if (form.get('requirementValue')?.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
        } @else {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Value</mat-label>
            <input matInput formControlName="requirementValue" maxlength="8000">
            @if (form.get('requirementValue')?.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Group</mat-label>
          <input matInput type="number" formControlName="grouping" min="1">
          <mat-hint>Same-group rules are AND'd; groups are OR'd</mat-hint>
          @if (form.get('grouping')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
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
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 460px; padding-top: 8px; }
    .full-width { width: 100%; }
    .half-width { width: 50%; }
  `]
})
export class RequirementDialogComponent {
  private svc = inject(RequirementService);
  private fb = inject(FormBuilder);
  form!: ReturnType<FormBuilder['group']>;
  saving = false;

  constructor(
    private dialogRef: MatDialogRef<RequirementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RequirementDialogData
  ) {
    this.form = this.fb.group({
      questionId: [data.requirement?.questionId ?? null, Validators.required],
      operatorId: [data.requirement?.operatorId ?? null, Validators.required],
      requirementValue: [data.requirement?.requirementValue ?? '', Validators.required],
      grouping: [data.requirement?.grouping ?? 1, [Validators.required, Validators.min(1)]]
    });
  }

  private selectedQuestion(): Question | undefined {
    return this.data.questions.find(q => q.questionId === this.form.get('questionId')?.value);
  }

  isListQuestion(): boolean {
    const q = this.selectedQuestion();
    return !!q && LIST_TYPE_IDS.includes(q.questionTypeId);
  }

  listItems(): string[] {
    const q = this.selectedQuestion();
    if (!q?.questionTypeAttributes) return [];
    try { return JSON.parse(q.questionTypeAttributes) as string[]; } catch { return []; }
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const payload = { ...this.form.value, scholarshipId: this.data.scholarshipId };
    const obs = this.data.requirement
      ? this.svc.update(this.data.requirement.scholarshipRequirementId, payload)
      : this.svc.create(payload);
    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.saving = false; }
    });
  }
}
