import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { OrgUsersService } from '../../core/services/org-users.service';

@Component({
  selector: 'app-add-user-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Add User</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email address</mat-label>
          <input matInput formControlName="userEmail" type="email" placeholder="user@example.com">
          @if (form.get('userEmail')?.hasError('required')) {
            <mat-error>Required</mat-error>
          }
          @if (form.get('userEmail')?.hasError('email')) {
            <mat-error>Enter a valid email address</mat-error>
          }
        </mat-form-field>
        @if (error) {
          <p class="error-msg">{{ error }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || saving" (click)="save()">
        {{ saving ? 'Adding…' : 'Add User' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 360px; padding-top: 8px; }
    .full-width { width: 100%; }
    .error-msg { color: #f44336; font-size: 12px; margin: 0; }
  `]
})
export class AddUserDialogComponent {
  private svc = inject(OrgUsersService);
  private fb = inject(FormBuilder);
  form!: ReturnType<FormBuilder['group']>;
  saving = false;
  error = '';

  constructor(
    private dialogRef: MatDialogRef<AddUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public organizationId: string
  ) {
    this.form = this.fb.group({
      userEmail: ['', [Validators.required, Validators.email]]
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    this.svc.addUser(this.organizationId, this.form.value.userEmail).subscribe({
      next: () => this.dialogRef.close(true),
      error: e => {
        this.saving = false;
        this.error = typeof e.error === 'string' ? e.error : 'Could not add user.';
      }
    });
  }
}
