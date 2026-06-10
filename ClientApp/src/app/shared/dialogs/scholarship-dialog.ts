import { Component, inject, Inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Scholarship, ScholarshipStatus } from '../../core/models/scholarship.model';
import { AwardYear } from '../../core/models/award-year.model';
import { Requirement, Operator } from '../../core/models/requirement.model';
import { Question } from '../../core/models/question.model';
import { Organization } from '../../core/models/organization.model';
import { SubOrganization } from '../../core/models/sub-organization.model';
import { AdminApplication } from '../../core/models/admin-application.model';
import { ScholarshipService } from '../../core/services/scholarship.service';
import { RequirementService } from '../../core/services/requirement.service';
import { QuestionService } from '../../core/services/question.service';
import { SubOrganizationService } from '../../core/services/sub-organization.service';
import { RequirementDialogComponent } from './requirement-dialog';

export interface ScholarshipDialogData {
  scholarship: Scholarship | null;
  organizationId: string;
  organizations: Organization[];
  awardYears: AwardYear[];
  statuses: ScholarshipStatus[];
  applications: AdminApplication[];
}

@Component({
  selector: 'app-scholarship-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatStepperModule, MatTableModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>{{ data.scholarship ? 'Edit Scholarship' : 'Create Scholarship' }}</h2>
    <mat-dialog-content>
      <mat-stepper [linear]="!data.scholarship" orientation="horizontal" #stepper (selectionChange)="onStepChange($event)">

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
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Organization</mat-label>
              <mat-select formControlName="organizationId">
                @for (o of data.organizations; track o.organizationId) {
                  <mat-option [value]="o.organizationId">{{ o.organizationName }}</mat-option>
                }
              </mat-select>
              @if (abstractForm.get('organizationId')?.hasError('required')) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Suborganization (optional)</mat-label>
              <mat-select formControlName="subOrganizationId">
                <mat-option [value]="null">— None —</mat-option>
                @for (s of subOrgs(); track s.subOrganizationId) {
                  <mat-option [value]="s.subOrganizationId">{{ s.subOrganizationName }}</mat-option>
                }
              </mat-select>
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
              <mat-label>Application (optional)</mat-label>
              <mat-select formControlName="applicationId">
                <mat-option [value]="null">— None —</mat-option>
                @for (a of data.applications; track a.applicationId) {
                  <mat-option [value]="a.applicationId">{{ a.scholarshipApplicationName }}</mat-option>
                }
              </mat-select>
              <mat-hint>The application form users will fill out when applying</mat-hint>
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

        <mat-step label="Requirements">
          <div class="step-form">
            @if (!data.scholarship) {
              <p class="hint">Save the scholarship first, then return here to add requirements.</p>
            } @else {
              <div class="req-header">
                <span class="req-count">{{ requirements().length }} requirement(s)</span>
                <button mat-stroked-button type="button" (click)="openAddReq()">
                  <mat-icon>add</mat-icon> Add
                </button>
              </div>
              @if (reqLoading()) {
                <div class="req-center"><mat-spinner diameter="32" /></div>
              } @else {
                <table mat-table [dataSource]="requirements()" class="req-table">
                  <ng-container matColumnDef="group">
                    <th mat-header-cell *matHeaderCellDef>Grp</th>
                    <td mat-cell *matCellDef="let r">{{ r.grouping }}</td>
                  </ng-container>
                  <ng-container matColumnDef="question">
                    <th mat-header-cell *matHeaderCellDef>Question</th>
                    <td mat-cell *matCellDef="let r" class="q-cell">{{ r.questionDescription }}</td>
                  </ng-container>
                  <ng-container matColumnDef="operator">
                    <th mat-header-cell *matHeaderCellDef>Operator</th>
                    <td mat-cell *matCellDef="let r">{{ r.operatorShownName }}</td>
                  </ng-container>
                  <ng-container matColumnDef="value">
                    <th mat-header-cell *matHeaderCellDef>Value</th>
                    <td mat-cell *matCellDef="let r">{{ formatValue(r.requirementValue) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button type="button" (click)="openEditReq(r)"><mat-icon>edit</mat-icon></button>
                      <button mat-icon-button type="button" color="warn" (click)="deleteReq(r)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="reqCols"></tr>
                  <tr mat-row *matRowDef="let r; columns: reqCols;"></tr>
                  <tr *matNoDataRow>
                    <td [attr.colspan]="reqCols.length" class="no-data">No requirements yet.</td>
                  </tr>
                </table>
              }
            }
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-button mat-dialog-close>Close</button>
            </div>
          </div>
        </mat-step>

      </mat-stepper>
    </mat-dialog-content>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    :host ::ng-deep .mat-mdc-dialog-content { max-height: calc(90vh - 80px) !important; }
    .step-form { display: flex; flex-direction: column; gap: 8px; min-width: 920px; padding-top: 16px; }
    .full-width { width: 100%; }
    .row-fields { display: flex; gap: 12px; }
    .row-fields mat-form-field { flex: 1; }
    .step-actions {
      position: sticky; bottom: 0;
      background: white;
      display: flex; justify-content: flex-end; gap: 8px;
      margin-top: 12px; padding: 10px 0 4px;
      border-top: 1px solid rgba(0,0,0,.08);
      z-index: 1;
    }
    .req-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .req-count { font-size: 0.9rem; color: #555; }
    .req-table { width: 100%; font-size: 0.85rem; }
    .q-cell { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .no-data { padding: 16px; text-align: center; color: #999; font-size: 0.85rem; }
    .req-center { display: flex; justify-content: center; padding: 24px; }
    .hint { color: #888; font-style: italic; }
  `]
})
export class ScholarshipDialogComponent {
  private svc = inject(ScholarshipService);
  private reqSvc = inject(RequirementService);
  private qSvc = inject(QuestionService);
  private subOrgSvc = inject(SubOrganizationService);
  private innerDialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  saving = false;
  abstractForm!: ReturnType<FormBuilder['group']>;
  detailsForm!: ReturnType<FormBuilder['group']>;

  requirements = signal<Requirement[]>([]);
  questions = signal<Question[]>([]);
  operators = signal<Operator[]>([]);
  subOrgs = signal<SubOrganization[]>([]);
  reqLoading = signal(false);
  reqCols = ['group', 'question', 'operator', 'value', 'actions'];

  constructor(
    private dialogRef: MatDialogRef<ScholarshipDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ScholarshipDialogData
  ) {
    const initOrgId = data.scholarship?.organizationId ?? data.organizationId;
    this.abstractForm = this.fb.group({
      scholarshipName: [data.scholarship?.scholarshipName ?? '', [Validators.required, Validators.maxLength(200)]],
      scholarshipDescription: [data.scholarship?.scholarshipDescription ?? '', [Validators.required, Validators.maxLength(8000)]],
      organizationId: [initOrgId, Validators.required],
      subOrganizationId: [data.scholarship?.subOrganizationId ?? null]
    });
    this.detailsForm = this.fb.group({
      awardYearId: [data.scholarship?.awardYearId ?? null],
      applicationId: [data.scholarship?.applicationId ?? null],
      scholarshipStatus: [data.scholarship?.scholarshipStatus ?? 1, Validators.required],
      amount: [data.scholarship?.amount ?? null],
      amountDescription: [data.scholarship?.amountDescription ?? ''],
      startDate: [data.scholarship?.startDate?.slice(0, 10) ?? null],
      endDate: [data.scholarship?.endDate?.slice(0, 10) ?? null],
      scholarshipUrl: [data.scholarship?.scholarshipUrl ?? ''],
      awardingInformation: [data.scholarship?.awardingInformation ?? ''],
      eligibilityInformation: [data.scholarship?.eligibilityInformation ?? '']
    });

    if (initOrgId) {
      this.subOrgSvc.getAll(initOrgId).subscribe(s => this.subOrgs.set(s));
    }

    this.abstractForm.get('organizationId')!.valueChanges.subscribe((orgId: string) => {
      this.subOrgs.set([]);
      this.abstractForm.get('subOrganizationId')!.setValue(null);
      if (orgId) {
        this.subOrgSvc.getAll(orgId).subscribe(s => this.subOrgs.set(s));
      }
    });

    if (data.scholarship) {
      this.reqSvc.getOperators().subscribe(o => this.operators.set(o));
      this.qSvc.getAll().subscribe(q => this.questions.set(q));
    }
  }

  onStepChange(e: { selectedIndex: number }) {
    if (e.selectedIndex === 2 && this.data.scholarship) {
      this.loadRequirements();
    }
  }

  loadRequirements() {
    this.reqLoading.set(true);
    this.reqSvc.getAll(this.data.scholarship!.scholarshipId).subscribe({
      next: r => { this.requirements.set(r); this.reqLoading.set(false); },
      error: () => this.reqLoading.set(false)
    });
  }

  openAddReq() {
    this.innerDialog.open(RequirementDialogComponent, {
      data: { requirement: null, scholarshipId: this.data.scholarship!.scholarshipId, questions: this.questions(), operators: this.operators() }
    }).afterClosed().subscribe(r => { if (r) this.loadRequirements(); });
  }

  openEditReq(r: Requirement) {
    this.innerDialog.open(RequirementDialogComponent, {
      data: { requirement: r, scholarshipId: this.data.scholarship!.scholarshipId, questions: this.questions(), operators: this.operators() }
    }).afterClosed().subscribe(r => { if (r) this.loadRequirements(); });
  }

  deleteReq(r: Requirement) {
    if (!confirm('Delete this requirement?')) return;
    this.reqSvc.delete(r.scholarshipRequirementId).subscribe({
      next: () => { this.snack.open('Requirement deleted.', '', { duration: 2500 }); this.loadRequirements(); },
      error: () => this.snack.open('Cannot delete.', 'Close', { duration: 4000 })
    });
  }

  formatValue(v: string): string {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch { /* not JSON */ }
    return v;
  }

  save() {
    if (this.abstractForm.invalid) return;
    this.saving = true;
    const payload = {
      ...this.abstractForm.value,
      ...this.detailsForm.value
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
