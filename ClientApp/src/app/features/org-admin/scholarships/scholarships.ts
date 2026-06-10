import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Scholarship, ScholarshipStatus } from '../../../core/models/scholarship.model';
import { AwardYear } from '../../../core/models/award-year.model';
import { Organization } from '../../../core/models/organization.model';
import { AdminApplication } from '../../../core/models/admin-application.model';
import { ScholarshipService } from '../../../core/services/scholarship.service';
import { AwardYearService } from '../../../core/services/award-year.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { AdminApplicationService } from '../../../core/services/admin-application.service';
import { ScholarshipDialogComponent } from '../../../shared/dialogs/scholarship-dialog';

const PUBLIC_ORG_ID = '00000000-0000-0000-0000-000000000000';

const STATUS_LABELS: Record<number, string> = {
  1: 'Draft', 2: 'Needs Coding', 3: 'Coded', 4: 'Live',
  5: 'Under Review', 6: 'Awarded', 7: 'Complete'
};

@Component({
  selector: 'app-org-scholarships',
  imports: [
    FormsModule, RouterLink,
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule,
    MatFormFieldModule, MatSelectModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Scholarships</h2>
        <div class="header-right">
          <mat-form-field appearance="outline" class="org-select">
            <mat-label>Organization</mat-label>
            <mat-select [(ngModel)]="selectedOrgId" (ngModelChange)="onOrgChange()">
              @for (o of orgs(); track o.organizationId) {
                <mat-option [value]="o.organizationId">{{ o.organizationName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" [disabled]="!selectedOrgId" (click)="openAdd()">
            <mat-icon>add</mat-icon> Create Scholarship
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else if (!selectedOrgId) {
        <p class="hint">Select an organization above to view and manage its scholarships.</p>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="scholarships()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row">{{ row.scholarshipName }}</td>
            </ng-container>
            <ng-container matColumnDef="awardYear">
              <th mat-header-cell *matHeaderCellDef>Award Year</th>
              <td mat-cell *matCellDef="let row">{{ row.awardYearDescription ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip>{{ statusLabel(row.scholarshipStatus) }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="openEdit(row)" title="Edit"><mat-icon>edit</mat-icon></button>
                <a mat-icon-button [routerLink]="['/org-admin/scholarships', row.scholarshipId, 'requirements']" title="Requirements">
                  <mat-icon>tune</mat-icon>
                </a>
                <button mat-icon-button color="warn" (click)="delete(row)" title="Delete"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            <tr *matNoDataRow>
              <td [attr.colspan]="cols.length" class="no-data">No scholarships yet. Click Create Scholarship to get started.</td>
            </tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .org-select { min-width: 220px; margin-bottom: -1.25em; }
    .full-width { width: 100%; }
    .no-data { padding: 24px; text-align: center; color: #666; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .hint { color: #666; }
  `]
})
export class OrgScholarshipsComponent implements OnInit {
  private svc    = inject(ScholarshipService);
  private aySvc  = inject(AwardYearService);
  private orgSvc = inject(OrganizationService);
  private appSvc = inject(AdminApplicationService);
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);

  orgs          = signal<Organization[]>([]);
  scholarships  = signal<Scholarship[]>([]);
  awardYears    = signal<AwardYear[]>([]);
  statuses      = signal<ScholarshipStatus[]>([]);
  applications  = signal<AdminApplication[]>([]);
  loading       = signal(false);
  selectedOrgId = '';
  cols = ['name', 'awardYear', 'status', 'actions'];

  statusLabel(id: number) { return STATUS_LABELS[id] ?? String(id); }

  ngOnInit() {
    this.svc.getStatuses().subscribe(s => this.statuses.set(s));
    this.orgSvc.getAll().subscribe(orgs =>
      this.orgs.set(orgs.filter(o => o.organizationId !== PUBLIC_ORG_ID))
    );
  }

  onOrgChange() {
    this.scholarships.set([]);
    this.load();
  }

  load() {
    if (!this.selectedOrgId) return;
    this.loading.set(true);
    this.aySvc.getAll(this.selectedOrgId).subscribe(a => this.awardYears.set(a));
    this.appSvc.getAll(this.selectedOrgId).subscribe(a => this.applications.set(a));
    this.svc.getAll(this.selectedOrgId).subscribe({
      next: d => { this.scholarships.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    this.dialog.open(ScholarshipDialogComponent, {
      width: '1020px', maxWidth: '98vw', height: '90vh',
      data: {
        scholarship: null,
        organizationId: this.selectedOrgId,
        organizations: this.orgs(),
        awardYears: this.awardYears(),
        statuses: this.statuses(),
        applications: this.applications()
      }
    }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(s: Scholarship) {
    this.dialog.open(ScholarshipDialogComponent, {
      width: '1020px', maxWidth: '98vw', height: '90vh',
      data: {
        scholarship: s,
        organizationId: this.selectedOrgId,
        organizations: this.orgs(),
        awardYears: this.awardYears(),
        statuses: this.statuses(),
        applications: this.applications()
      }
    }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(s: Scholarship) {
    if (!confirm(`Delete "${s.scholarshipName}"?`)) return;
    this.svc.delete(s.scholarshipId).subscribe({
      next: () => { this.snack.open('Scholarship deleted.', '', { duration: 2500 }); this.load(); },
      error: e => this.snack.open(typeof e.error === 'string' ? e.error : 'Cannot delete.', 'Close', { duration: 4000 })
    });
  }
}
