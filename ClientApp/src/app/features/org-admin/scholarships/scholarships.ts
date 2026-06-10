import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
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
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Scholarships</h2>
        <button mat-raised-button color="primary" (click)="openAdd()">
          <mat-icon>add</mat-icon> Create Scholarship
        </button>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
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
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .no-data { padding: 24px; text-align: center; color: #666; }
    .center { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class OrgScholarshipsComponent implements OnInit {
  private svc    = inject(ScholarshipService);
  private aySvc  = inject(AwardYearService);
  private orgSvc = inject(OrganizationService);
  private appSvc = inject(AdminApplicationService);
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);

  scholarships  = signal<Scholarship[]>([]);
  awardYears    = signal<AwardYear[]>([]);
  statuses      = signal<ScholarshipStatus[]>([]);
  organizations = signal<Organization[]>([]);
  applications  = signal<AdminApplication[]>([]);
  loading = signal(true);
  cols = ['name', 'awardYear', 'status', 'actions'];

  statusLabel(id: number) { return STATUS_LABELS[id] ?? String(id); }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getStatuses().subscribe(s => this.statuses.set(s));
    this.aySvc.getAll(PUBLIC_ORG_ID).subscribe(a => this.awardYears.set(a));
    this.orgSvc.getAll().subscribe(o => this.organizations.set(o));
    this.appSvc.getAll().subscribe(a => this.applications.set(a));
    this.svc.getAll(PUBLIC_ORG_ID).subscribe({
      next: d => { this.scholarships.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    this.dialog.open(ScholarshipDialogComponent, {
      width: '1020px', maxWidth: '98vw', height: '90vh',
      data: { scholarship: null, organizationId: PUBLIC_ORG_ID, organizations: this.organizations(), awardYears: this.awardYears(), statuses: this.statuses(), applications: this.applications() }
    }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(s: Scholarship) {
    this.dialog.open(ScholarshipDialogComponent, {
      width: '1020px', maxWidth: '98vw', height: '90vh',
      data: { scholarship: s, organizationId: PUBLIC_ORG_ID, organizations: this.organizations(), awardYears: this.awardYears(), statuses: this.statuses(), applications: this.applications() }
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
