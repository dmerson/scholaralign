import { Component, inject, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Question, QuestionType } from '../../core/models/question.model';
import { QuestionService } from '../../core/services/question.service';

export interface QuestionDialogData {
  question: Question | null;
  types: QuestionType[];
}

const LIST_TYPE_IDS = [4, 5, 6]; // Checkbox List, Radiobutton List, Dropdown List

@Component({
  selector: 'app-question-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
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

        @if (isListType()) {
          <div class="list-items-section">
            <p class="list-label">List Items</p>
            @for (ctrl of listItems.controls; track $index; let i = $index) {
              <div class="item-row">
                <mat-form-field appearance="outline" class="item-field">
                  <input matInput [formControl]="asControl(ctrl)" maxlength="200" placeholder="Item {{ i + 1 }}">
                </mat-form-field>
                <button mat-icon-button type="button" color="warn" (click)="removeItem(i)" aria-label="Remove">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            }
            <div class="item-row">
              <mat-form-field appearance="outline" class="item-field">
                <mat-label>New item</mat-label>
                <input matInput [formControl]="newItemCtrl" maxlength="200"
                  (keydown.enter)="addItem(); $event.preventDefault()">
              </mat-form-field>
              <button mat-stroked-button type="button" (click)="addItem()" [disabled]="!newItemCtrl.value?.trim()">
                Add
              </button>
            </div>
          </div>
        }
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
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 420px; padding-top: 8px; }
    .full-width { width: 100%; }
    .list-items-section { border: 1px solid #e0e0e0; border-radius: 4px; padding: 12px 12px 4px; }
    .list-label { margin: 0 0 8px; font-size: 0.875rem; font-weight: 500; color: rgba(0,0,0,.6); }
    .item-row { display: flex; align-items: center; gap: 8px; }
    .item-field { flex: 1; }
  `]
})
export class QuestionDialogComponent {
  private svc = inject(QuestionService);
  private fb = inject(FormBuilder);
  form!: ReturnType<FormBuilder['group']>;
  listItems!: FormArray;
  newItemCtrl!: FormControl;
  saving = false;

  constructor(
    private dialogRef: MatDialogRef<QuestionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuestionDialogData
  ) {
    this.newItemCtrl = this.fb.control('');

    const existingItems = data.question && LIST_TYPE_IDS.includes(data.question.questionTypeId)
      ? this.parseItems(data.question.questionTypeAttributes)
      : [];
    this.listItems = this.fb.array(existingItems.map(v => this.fb.control(v, Validators.required)));

    this.form = this.fb.group({
      questionDescription: [data.question?.questionDescription ?? '', [Validators.required, Validators.maxLength(1000)]],
      questionTypeId: [data.question?.questionTypeId ?? null, Validators.required],
      questionOrder: [data.question?.questionOrder ?? null]
    });
  }

  isListType(): boolean {
    return LIST_TYPE_IDS.includes(this.form.get('questionTypeId')?.value);
  }

  asControl(ctrl: unknown): FormControl {
    return ctrl as FormControl;
  }

  addItem() {
    const val = this.newItemCtrl.value?.trim();
    if (!val) return;
    this.listItems.push(this.fb.control(val, Validators.required));
    this.newItemCtrl.setValue('');
  }

  removeItem(index: number) {
    this.listItems.removeAt(index);
  }

  private parseItems(attrs: string | null | undefined): string[] {
    if (!attrs) return [];
    try { return JSON.parse(attrs) as string[]; } catch { return []; }
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const val = this.form.value;
    const questionTypeAttributes = this.isListType() && this.listItems.length > 0
      ? JSON.stringify(this.listItems.value)
      : null;
    const payload = { ...val, questionTypeAttributes };
    const obs = this.data.question
      ? this.svc.update(this.data.question.questionId, payload)
      : this.svc.create(payload);
    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.saving = false; }
    });
  }
}
