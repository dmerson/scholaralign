import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { SubOrganization } from '../../core/models/sub-organization.model';
import { ScholarshipWithCommittees } from '../../core/models/committee.model';
import { CommitteesService } from '../../core/services/committees.service';

export interface AssignCommitteeDialogData {
  scholarship: ScholarshipWithCommittees;
  allCommittees: SubOrganization[];
}

@Component({
  selector: 'app-assign-committee-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Assign Committee</h2>
    <mat-dialog-content>
      <p class="subtitle">{{ data.scholarship.scholarshipName }}</p>
      @if (!availableCommittees.length) {
        <p class="hint">All committees are already assigned to this scholarship.</p>
      } @else {
        <form [formGroup]="form" class="dialog-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Committee</mat-label>
            <mat-select formControlName="subOrganizationId">
              @for (c of availableCommittees; track c.subOrganizationId) {
                <mat-option [value]="c.subOrganizationId">{{ c.subOrganizationName }}</mat-option>
              }
            </mat-select>
            @if (form.get('subOrganizationId')?.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
          @if (error) {
            <p class="error-msg">{{ error }}</p>
          }
        </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      @if (availableCommittees.length) {
        <button mat-raised-button color="primary" [disabled]="form.invalid || saving" (click)="save()">
          {{ saving ? 'Assigning…' : 'Assign' }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 340px; padding-top: 8px; }
    .full-width { width: 100%; }
    .subtitle { color: #666; font-size: 14px; margin: 0 0 8px; }
    .hint { color: #888; font-style: italic; min-width: 280px; }
    .error-msg { color: #f44336; font-size: 12px; margin: 0; }
  `]
})
export class AssignCommitteeDialogComponent {
  private svc = inject(CommitteesService);
  private fb  = inject(FormBuilder);
  form!: ReturnType<FormBuilder['group']>;
  saving = false;
  error  = '';

  availableCommittees: SubOrganization[];

  constructor(
    private dialogRef: MatDialogRef<AssignCommitteeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignCommitteeDialogData
  ) {
    const assignedIds = new Set(data.scholarship.committees.map(c => c.subOrganizationId));
    this.availableCommittees = data.allCommittees.filter(c => !assignedIds.has(c.subOrganizationId));

    this.form = this.fb.group({
      subOrganizationId: [null, Validators.required]
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error  = '';
    this.svc.assign(this.data.scholarship.scholarshipId, this.form.value.subOrganizationId).subscribe({
      next: () => this.dialogRef.close(true),
      error: e => {
        this.saving = false;
        this.error = typeof e.error === 'string' ? e.error : 'Could not assign committee.';
      }
    });
  }
}
