import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { OrgRoleName, OrgUser } from '../../core/models/org-user.model';
import { OrgUsersService } from '../../core/services/org-users.service';

export interface AddRoleDialogData {
  user: OrgUser;
  availableRoles: OrgRoleName[];
}

@Component({
  selector: 'app-add-role-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Add Role</h2>
    <mat-dialog-content>
      <p class="subtitle">{{ data.user.userEmail }}</p>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Role</mat-label>
          <mat-select formControlName="roleNameId">
            @for (r of assignableRoles; track r.organizationRoleNameId) {
              <mat-option [value]="r.organizationRoleNameId">{{ r.organizationRoleNameDescription }}</mat-option>
            }
          </mat-select>
          @if (form.get('roleNameId')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        @if (error) {
          <p class="error-msg">{{ error }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || saving || !assignableRoles.length" (click)="save()">
        {{ saving ? 'Saving…' : 'Add Role' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 320px; padding-top: 8px; }
    .full-width { width: 100%; }
    .subtitle { color: #666; font-size: 14px; margin: 0 0 8px; }
    .error-msg { color: #f44336; font-size: 12px; margin: 0; }
  `]
})
export class AddRoleDialogComponent {
  private svc = inject(OrgUsersService);
  private fb = inject(FormBuilder);
  form!: ReturnType<FormBuilder['group']>;
  saving = false;
  error = '';

  assignableRoles: OrgRoleName[];

  constructor(
    private dialogRef: MatDialogRef<AddRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddRoleDialogData
  ) {
    const existingIds = new Set(data.user.roles.map(r => r.organizationRoleNameId));
    this.assignableRoles = data.availableRoles.filter(r => !existingIds.has(r.organizationRoleNameId));

    this.form = this.fb.group({
      roleNameId: [null, Validators.required]
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    this.svc.addRole(this.data.user.organizationUserId, this.form.value.roleNameId).subscribe({
      next: () => this.dialogRef.close(true),
      error: e => {
        this.saving = false;
        this.error = typeof e.error === 'string' ? e.error : 'Could not add role.';
      }
    });
  }
}
