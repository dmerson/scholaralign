import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { Scholarship, ScholarshipStatus } from '../../core/models/scholarship.model';
import { AwardYear } from '../../core/models/award-year.model';
import { ScholarshipService } from '../../core/services/scholarship.service';

export interface ScholarshipDialogData {
  scholarship: Scholarship | null;
  organizationId: string;
  awardYears: AwardYear[];
  statuses: ScholarshipStatus[];
}

@Component({
  selector: 'app-scholarship-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatStepperModule],
  template: `
    <h2 mat-dialog-title>{{ data.scholarship ? 'Edit Scholarship' : 'Create Scholarship' }}</h2>
    <mat-dialog-content>
      <mat-stepper [linear]="!data.scholarship" orientation="horizontal" #stepper>

        <mat-step [stepControl]="abstractForm" label="Basic Info">
          <form [formGroup]="abstractForm" class="step-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Scholarship Name</mat-label>
              <input matInput formControlName="scholarshipName" maxlength="200">
              @if (abstractForm.get('scholarshipName')?.hasError('required')) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="scholarshipDescription" rows="4" maxlength="8000"></textarea>
              @if (abstractForm.get('scholarshipDescription')?.hasError('required')) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
            <div class="step-actions">
              <button mat-button mat-dialog-close>Cancel</button>
              <button mat-raised-button color="primary" matStepperNext [disabled]="abstractForm.invalid">Next</button>
            </div>
          </form>
        </mat-step>

        <mat-step label="Details">
          <form [formGroup]="detailsForm" class="step-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Award Year</mat-label>
              <mat-select formControlName="awardYearId">
                <mat-option [value]="null">— None —</mat-option>
                @for (ay of data.awardYears; track ay.awardYearId) {
                  <mat-option [value]="ay.awardYearId">{{ ay.awardYearDescription }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Status</mat-label>
              <mat-select formControlName="scholarshipStatus">
                @for (s of data.statuses; track s.scholarshipStatusId) {
                  <mat-option [value]="s.scholarshipStatusId">{{ s.scholarshipStatusDescription }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <div class="row-fields">
              <mat-form-field appearance="outline">
                <mat-label>Amount</mat-label>
                <input matInput type="number" formControlName="amount" min="0">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Amount Description</mat-label>
                <input matInput formControlName="amountDescription" maxlength="20" placeholder="e.g. $500–$1000">
              </mat-form-field>
            </div>
            <div class="row-fields">
              <mat-form-field appearance="outline">
                <mat-label>Start Date</mat-label>
                <input matInput type="date" formControlName="startDate">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>End Date</mat-label>
                <input matInput type="date" formControlName="endDate">
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Scholarship URL</mat-label>
              <input matInput formControlName="scholarshipUrl" maxlength="256">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Awarding Information</mat-label>
              <textarea matInput formControlName="awardingInformation" rows="2" maxlength="2000"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Eligibility Information</mat-label>
              <textarea matInput formControlName="eligibilityInformation" rows="2" maxlength="2000"></textarea>
            </mat-form-field>
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-button mat-dialog-close>Cancel</button>
              <button mat-raised-button color="primary" [disabled]="saving" (click)="save()">
                {{ saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </form>
        </mat-step>

      </mat-stepper>
    </mat-dialog-content>
  `,
  styles: [`
    .step-form { display: flex; flex-direction: column; gap: 8px; min-width: 480px; padding-top: 16px; }
    .full-width { width: 100%; }
    .row-fields { display: flex; gap: 12px; }
    .row-fields mat-form-field { flex: 1; }
    .step-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
  `]
})
export class ScholarshipDialogComponent {
  private svc = inject(ScholarshipService);
  private fb = inject(FormBuilder);
  saving = false;
  abstractForm!: ReturnType<FormBuilder['group']>;
  detailsForm!: ReturnType<FormBuilder['group']>;

  constructor(
    private dialogRef: MatDialogRef<ScholarshipDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ScholarshipDialogData
  ) {
    this.abstractForm = this.fb.group({
      scholarshipName: [data.scholarship?.scholarshipName ?? '', [Validators.required, Validators.maxLength(200)]],
      scholarshipDescription: [data.scholarship?.scholarshipDescription ?? '', [Validators.required, Validators.maxLength(8000)]]
    });
    this.detailsForm = this.fb.group({
      awardYearId: [data.scholarship?.awardYearId ?? null],
      scholarshipStatus: [data.scholarship?.scholarshipStatus ?? 1, Validators.required],
      amount: [data.scholarship?.amount ?? null],
      amountDescription: [data.scholarship?.amountDescription ?? ''],
      startDate: [data.scholarship?.startDate?.slice(0, 10) ?? null],
      endDate: [data.scholarship?.endDate?.slice(0, 10) ?? null],
      scholarshipUrl: [data.scholarship?.scholarshipUrl ?? ''],
      awardingInformation: [data.scholarship?.awardingInformation ?? ''],
      eligibilityInformation: [data.scholarship?.eligibilityInformation ?? '']
    });
  }

  save() {
    if (this.abstractForm.invalid) return;
    this.saving = true;
    const payload = {
      ...this.abstractForm.value,
      ...this.detailsForm.value,
      organizationId: this.data.organizationId,
      subOrganizationId: this.data.scholarship?.subOrganizationId ?? null
    };
    const obs = this.data.scholarship
      ? this.svc.update(this.data.scholarship.scholarshipId, payload as Partial<Scholarship>)
      : this.svc.create(payload as Partial<Scholarship>);
    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.saving = false; }
    });
  }
}
