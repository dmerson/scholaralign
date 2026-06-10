import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AwardYear } from '../../core/models/award-year.model';
import { AwardYearService } from '../../core/services/award-year.service';

export interface AwardYearDialogData {
  awardYear: AwardYear | null;
  organizationId: string;
}

@Component({
  selector: 'app-award-year-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.awardYear ? 'Edit' : 'Add' }} Award Year</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <input matInput formControlName="awardYearDescription" maxlength="30" placeholder="e.g. 2026-2027 Fall">
          @if (form.get('awardYearDescription')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Year</mat-label>
          <input matInput type="number" formControlName="year" min="2000" max="2100">
          @if (form.get('year')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Semester</mat-label>
          <input matInput formControlName="semester" maxlength="50" placeholder="e.g. Fall, Spring, Annual">
          @if (form.get('semester')?.hasError('required')) {
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
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 380px; padding-top: 8px; } .full-width { width: 100%; }`]
})
export class AwardYearDialogComponent {
  private svc = inject(AwardYearService);
  private fb = inject(FormBuilder);
  form!: ReturnType<FormBuilder['group']>;
  saving = false;

  constructor(
    private dialogRef: MatDialogRef<AwardYearDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AwardYearDialogData
  ) {
    this.form = this.fb.group({
      awardYearDescription: [data.awardYear?.awardYearDescription ?? '', [Validators.required, Validators.maxLength(30)]],
      year: [data.awardYear?.year ?? new Date().getFullYear(), Validators.required],
      semester: [data.awardYear?.semester ?? '', [Validators.required, Validators.maxLength(50)]]
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const payload = { ...this.form.value, organizationId: this.data.organizationId };
    const obs = this.data.awardYear
      ? this.svc.update(this.data.awardYear.awardYearId, payload)
      : this.svc.create(payload);
    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.saving = false; }
    });
  }
}
