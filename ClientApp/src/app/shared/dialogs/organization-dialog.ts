import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { Organization } from '../../core/models/organization.model';
import { OrganizationService } from '../../core/services/organization.service';

export interface OrganizationDialogData {
  organization: Organization | null;
}

@Component({
  selector: 'app-organization-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.organization ? 'Edit' : 'Add' }} Organization</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Organization Name</mat-label>
          <input matInput formControlName="organizationName" maxlength="200">
          @if (form.get('organizationName')?.hasError('required')) { <mat-error>Required</mat-error> }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contact Email / Name</mat-label>
          <input matInput formControlName="contact" maxlength="256">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Website</mat-label>
          <input matInput formControlName="webSite" maxlength="256" placeholder="https://...">
        </mat-form-field>
        <mat-checkbox formControlName="isPublic">Public (visible to all users)</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || saving" (click)="save()">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 12px; min-width: 420px; padding-top: 8px; } .full-width { width: 100%; }`]
})
export class OrganizationDialogComponent {
  private svc = inject(OrganizationService);
  private fb = inject(FormBuilder);
  form!: ReturnType<FormBuilder['group']>;
  saving = false;

  constructor(
    private dialogRef: MatDialogRef<OrganizationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrganizationDialogData
  ) {
    this.form = this.fb.group({
      organizationName: [data.organization?.organizationName ?? '', [Validators.required, Validators.maxLength(200)]],
      contact: [data.organization?.contact ?? ''],
      webSite: [data.organization?.webSite ?? ''],
      isPublic: [data.organization?.isPublic ?? false]
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const obs = this.data.organization
      ? this.svc.update(this.data.organization.organizationId, this.form.value)
      : this.svc.create(this.form.value);
    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.saving = false; }
    });
  }
}
