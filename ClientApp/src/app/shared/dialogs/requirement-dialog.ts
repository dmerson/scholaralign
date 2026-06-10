import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
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
const MULTI_OP_IDS = [7, 8]; // In List, Not In List

@Component({
  selector: 'app-requirement-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatChipsModule],
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
          @if (form.get('questionId')?.hasError('required')) { <mat-error>Required</mat-error> }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Operator</mat-label>
          <mat-select formControlName="operatorId">
            @for (o of data.operators; track o.operatorId) {
              <mat-option [value]="o.operatorId">{{ o.operatorShownName }}</mat-option>
            }
          </mat-select>
          @if (form.get('operatorId')?.hasError('required')) { <mat-error>Required</mat-error> }
        </mat-form-field>

        @if (isMultiSelect() && isListQuestion()) {
          <!-- In List / Not In List on a list-type question: multi-select with chip feedback -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Acceptable Values</mat-label>
            <mat-select formControlName="requirementValue" [multiple]="true">
              @for (item of listItems(); track item) {
                <mat-option [value]="item">{{ item }}</mat-option>
              }
            </mat-select>
            <mat-hint>Applicant matches if their answer is any of the selected values</mat-hint>
            @if (form.get('requirementValue')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>
          @if (selectedValues().length) {
            <div class="chip-row">
              <span class="chip-label">Selected:</span>
              <mat-chip-set>
                @for (item of selectedValues(); track item) {
                  <mat-chip>{{ item }}</mat-chip>
                }
              </mat-chip-set>
            </div>
          }
        } @else if (!isMultiSelect() && isListQuestion()) {
          <!-- Single value from a list-type question -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Value</mat-label>
            <mat-select formControlName="requirementValue">
              @for (item of listItems(); track item) {
                <mat-option [value]="item">{{ item }}</mat-option>
              }
            </mat-select>
            @if (form.get('requirementValue')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>
        } @else {
          <!-- Free-text for non-list questions -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Value</mat-label>
            <input matInput formControlName="requirementValue" maxlength="8000">
            @if (form.get('requirementValue')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Group</mat-label>
          <input matInput type="number" formControlName="grouping" min="1">
          <mat-hint>Same-group rules are AND'd; groups are OR'd</mat-hint>
          @if (form.get('grouping')?.hasError('required')) { <mat-error>Required</mat-error> }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!canSave() || saving" (click)="save()">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 460px; padding-top: 8px; }
    .full-width { width: 100%; }
    .half-width { width: 50%; }
    .chip-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 0 2px 4px; }
    .chip-label { font-size: 0.8rem; color: rgba(0,0,0,.6); white-space: nowrap; }
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
      requirementValue: [this.initValue(data.requirement), Validators.required],
      grouping: [data.requirement?.grouping ?? 1, [Validators.required, Validators.min(1)]]
    });

    // Reset value when operator changes (scalar ↔ array modes differ)
    this.form.get('operatorId')!.valueChanges.subscribe(opId => {
      this.form.get('requirementValue')!.setValue(MULTI_OP_IDS.includes(opId) ? [] : '');
    });

    // Reset value when question changes
    this.form.get('questionId')!.valueChanges.subscribe(() => {
      const opId = this.form.get('operatorId')?.value;
      this.form.get('requirementValue')!.setValue(MULTI_OP_IDS.includes(opId) ? [] : '');
    });
  }

  private initValue(r: Requirement | null): string | string[] {
    if (!r) return '';
    if (MULTI_OP_IDS.includes(r.operatorId)) {
      try {
        const parsed = JSON.parse(r.requirementValue);
        return Array.isArray(parsed) ? parsed : [r.requirementValue];
      } catch { return [r.requirementValue]; }
    }
    return r.requirementValue;
  }

  private selectedQuestion(): Question | undefined {
    return this.data.questions.find(q => q.questionId === this.form.get('questionId')?.value);
  }

  isListQuestion(): boolean {
    const q = this.selectedQuestion();
    return !!q && LIST_TYPE_IDS.includes(q.questionTypeId);
  }

  isMultiSelect(): boolean {
    return MULTI_OP_IDS.includes(this.form.get('operatorId')?.value);
  }

  selectedValues(): string[] {
    const v = this.form.get('requirementValue')?.value;
    return Array.isArray(v) ? v : [];
  }

  listItems(): string[] {
    const q = this.selectedQuestion();
    if (!q?.questionTypeAttributes) return [];
    try { return JSON.parse(q.questionTypeAttributes) as string[]; } catch { return []; }
  }

  canSave(): boolean {
    if (this.form.invalid) return false;
    if (this.isMultiSelect()) {
      const v = this.form.get('requirementValue')?.value;
      return Array.isArray(v) && v.length > 0;
    }
    return true;
  }

  save() {
    if (!this.canSave()) return;
    this.saving = true;
    const rawValue = this.form.get('requirementValue')!.value;
    const requirementValue = Array.isArray(rawValue) ? JSON.stringify(rawValue) : rawValue;
    const payload = {
      questionId: this.form.get('questionId')!.value,
      operatorId: this.form.get('operatorId')!.value,
      requirementValue,
      grouping: this.form.get('grouping')!.value,
      scholarshipId: this.data.scholarshipId
    };
    const obs = this.data.requirement
      ? this.svc.update(this.data.requirement.scholarshipRequirementId, payload)
      : this.svc.create(payload);
    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.saving = false; }
    });
  }
}
