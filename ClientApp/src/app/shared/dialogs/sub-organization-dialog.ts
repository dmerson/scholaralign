import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { SubOrganization } from '../../core/models/sub-organization.model';
import { SubOrganizationService } from '../../core/services/sub-organization.service';

export interface SubOrganizationDialogData {
  subOrganization: SubOrganization | null;
  organizationId: string;
  /** All suborgs for this org — used to populate parent select (excluding self on edit) */
  peers: SubOrganization[];
  /** Pre-selected parentId when using Add Child shortcut */
  defaultParentId?: string | null;
}

@Component({
  selector: 'app-sub-organization-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.subOrganization ? 'Edit' : 'Add' }} Suborganization</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="subOrganizationName" maxlength="100">
          @if (form.get('subOrganizationName')?.hasError('required')) { <mat-error>Required</mat-error> }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Parent (leave blank for top-level)</mat-label>
          <mat-select formControlName="subOrganizationParentId">
            <mat-option [value]="null">— None (top-level) —</mat-option>
            @for (p of parentOptions(); track p.subOrganizationId) {
              <mat-option [value]="p.subOrganizationId">{{ p.subOrganizationName }}</mat-option>
            }
          </mat-select>
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
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 12px; min-width: 400px; padding-top: 8px; } .full-width { width: 100%; }`]
})
export class SubOrganizationDialogComponent {
  private svc = inject(SubOrganizationService);
  private fb = inject(FormBuilder);
  form!: ReturnType<FormBuilder['group']>;
  saving = false;

  constructor(
    private dialogRef: MatDialogRef<SubOrganizationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubOrganizationDialogData
  ) {
    this.form = this.fb.group({
      subOrganizationName: [data.subOrganization?.subOrganizationName ?? '', [Validators.required, Validators.maxLength(100)]],
      subOrganizationParentId: [data.subOrganization?.subOrganizationParentId ?? data.defaultParentId ?? null]
    });
  }

  parentOptions(): SubOrganization[] {
    const selfId = this.data.subOrganization?.subOrganizationId;
    return this.data.peers.filter(p => p.subOrganizationId !== selfId);
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const payload = { ...this.form.value, organizationId: this.data.organizationId };
    const obs = this.data.subOrganization
      ? this.svc.update(this.data.subOrganization.subOrganizationId, payload)
      : this.svc.create(payload);
    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.saving = false; }
    });
  }
}
