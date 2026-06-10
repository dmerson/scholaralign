import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Organization } from '../../core/models/organization.model';
import { SubOrganization } from '../../core/models/sub-organization.model';
import { AdminApplication } from '../../core/models/admin-application.model';
import { AdminApplicationService } from '../../core/services/admin-application.service';
import { SubOrganizationService } from '../../core/services/sub-organization.service';

export interface ApplicationDialogData {
  application: AdminApplication | null;
  organizations: Organization[];
}

@Component({
  selector: 'app-application-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
            MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data.application ? 'Edit' : 'New' }} Application</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Application Name</mat-label>
          <input matInput formControlName="scholarshipApplicationName" maxlength="50" />
          @if (form.get('scholarshipApplicationName')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
          @if (form.get('scholarshipApplicationName')?.hasError('maxlength')) {
            <mat-error>Max 50 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Organization</mat-label>
          <mat-select formControlName="organizationId">
            @for (o of data.organizations; track o.organizationId) {
              <mat-option [value]="o.organizationId">{{ o.organizationName }}</mat-option>
            }
          </mat-select>
          @if (form.get('organizationId')?.hasError('required')) {
            <mat-error>Organization is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Sub-Organization (optional)</mat-label>
          <mat-select formControlName="subOrganizationId">
            <mat-option [value]="null">— None —</mat-option>
            @for (s of subOrgs(); track s.subOrganizationId) {
              <mat-option [value]="s.subOrganizationId">{{ s.subOrganizationName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary"
              [disabled]="form.invalid || saving()"
              (click)="save()">
        @if (saving()) { <mat-spinner diameter="18" /> }
        @else { Save }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 440px; padding-top: 8px; }
    .full-width { width: 100%; }
    mat-dialog-actions button mat-spinner { display: inline-block; margin-right: 4px; }
  `]
})
export class ApplicationDialogComponent implements OnInit {
  private svc    = inject(AdminApplicationService);
  private subSvc = inject(SubOrganizationService);
  private fb     = inject(FormBuilder);

  subOrgs = signal<SubOrganization[]>([]);
  saving  = signal(false);

  form = this.fb.group({
    scholarshipApplicationName: ['', [Validators.required, Validators.maxLength(50)]],
    organizationId:    [null as string | null, Validators.required],
    subOrganizationId: [null as string | null]
  });

  constructor(
    private dialogRef: MatDialogRef<ApplicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ApplicationDialogData
  ) {}

  ngOnInit() {
    if (this.data.application) {
      this.form.patchValue({
        scholarshipApplicationName: this.data.application.scholarshipApplicationName,
        organizationId:    this.data.application.organizationId,
        subOrganizationId: this.data.application.subOrganizationId ?? null
      });
      this.loadSubOrgs(this.data.application.organizationId);
    }

    this.form.get('organizationId')!.valueChanges.subscribe(orgId => {
      this.form.get('subOrganizationId')!.setValue(null);
      if (orgId) this.loadSubOrgs(orgId);
      else this.subOrgs.set([]);
    });
  }

  private loadSubOrgs(orgId: string) {
    this.subSvc.getAll(orgId).subscribe(s => this.subOrgs.set(s));
  }

  save() {
    if (this.form.invalid) return;
    const val = this.form.value;
    const payload = {
      scholarshipApplicationName: val.scholarshipApplicationName!,
      organizationId:    val.organizationId!,
      subOrganizationId: val.subOrganizationId ?? null
    };
    this.saving.set(true);
    const obs = this.data.application
      ? this.svc.update(this.data.application.applicationId, payload)
      : this.svc.create(payload);
    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.saving.set(false)
    });
  }
}
