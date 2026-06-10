import { Component, OnInit, inject, signal } from '@angular/core';
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
import { FormsModule } from '@angular/forms';
import { Organization } from '../../../core/models/organization.model';
import { SubOrganization } from '../../../core/models/sub-organization.model';
import { ScholarshipWithCommittees, CommitteeAssignment } from '../../../core/models/committee.model';
import { OrganizationService } from '../../../core/services/organization.service';
import { SubOrganizationService } from '../../../core/services/sub-organization.service';
import { CommitteesService } from '../../../core/services/committees.service';
import { AssignCommitteeDialogComponent, AssignCommitteeDialogData } from '../../../shared/dialogs/assign-committee-dialog';

const PUBLIC_ORG_ID = '00000000-0000-0000-0000-000000000000';

@Component({
  selector: 'app-committees',
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatFormFieldModule, MatSelectModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Assign Committees</h2>
        <div class="header-right">
          <mat-form-field appearance="outline" class="org-select">
            <mat-label>Organization</mat-label>
            <mat-select [(ngModel)]="selectedOrgId" (ngModelChange)="onOrgChange()">
              @for (o of orgs(); track o.organizationId) {
                <mat-option [value]="o.organizationId">{{ o.organizationName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <p class="hint">Link a committee (suborganization) to a scholarship. Members of that committee can then review applications for those scholarships.</p>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else if (!selectedOrgId) {
        <p class="empty">Select an organization above to manage committee assignments.</p>
      } @else if (!committees().length) {
        <p class="empty">No committees found for this organization. Add suborganizations first via Organization Hierarchy.</p>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="scholarships()" class="full-width">

            <ng-container matColumnDef="scholarship">
              <th mat-header-cell *matHeaderCellDef>Scholarship</th>
              <td mat-cell *matCellDef="let row">{{ row.scholarshipName }}</td>
            </ng-container>

            <ng-container matColumnDef="assigned">
              <th mat-header-cell *matHeaderCellDef>Assigned Committees</th>
              <td mat-cell *matCellDef="let row">
                <div class="chips-cell">
                  <mat-chip-set>
                    @for (c of row.committees; track c.scholarshipCommitteeId) {
                      <mat-chip (removed)="unassign(row, c)">
                        {{ c.subOrganizationName }}
                        <button matChipRemove aria-label="Remove committee"><mat-icon>cancel</mat-icon></button>
                      </mat-chip>
                    }
                  </mat-chip-set>
                  <button mat-stroked-button class="assign-btn" (click)="openAssign(row)">
                    <mat-icon>add</mat-icon> Assign
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            <tr *matNoDataRow>
              <td [attr.colspan]="cols.length" class="no-data">
                No scholarships found for this organization.
              </td>
            </tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 16px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .org-select { min-width: 220px; margin-bottom: -1.25em; }
    .hint { color: #666; font-size: 14px; margin-bottom: 20px; }
    .empty { color: #888; font-style: italic; }
    .full-width { width: 100%; }
    .no-data { padding: 24px; text-align: center; color: #666; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .chips-cell { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 4px 0; }
    .assign-btn { height: 32px; line-height: 32px; font-size: 12px; }
  `]
})
export class CommitteesComponent implements OnInit {
  private orgSvc  = inject(OrganizationService);
  private subSvc  = inject(SubOrganizationService);
  private svc     = inject(CommitteesService);
  private dialog  = inject(MatDialog);
  private snack   = inject(MatSnackBar);

  orgs         = signal<Organization[]>([]);
  scholarships = signal<ScholarshipWithCommittees[]>([]);
  committees   = signal<SubOrganization[]>([]);
  loading      = signal(false);
  selectedOrgId = '';
  cols = ['scholarship', 'assigned'];

  ngOnInit() {
    this.orgSvc.getAll().subscribe(orgs =>
      this.orgs.set(orgs.filter(o => o.organizationId !== PUBLIC_ORG_ID))
    );
  }

  onOrgChange() {
    this.scholarships.set([]);
    this.committees.set([]);
    this.load();
  }

  load() {
    if (!this.selectedOrgId) return;
    this.loading.set(true);
    // Load scholarships-with-committees and all suborgs for this org in parallel
    this.svc.getByOrg(this.selectedOrgId).subscribe({
      next: s => { this.scholarships.set(s); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.subSvc.getAll(this.selectedOrgId).subscribe(c => this.committees.set(c));
  }

  openAssign(scholarship: ScholarshipWithCommittees) {
    const data: AssignCommitteeDialogData = {
      scholarship,
      allCommittees: this.committees()
    };
    this.dialog
      .open(AssignCommitteeDialogComponent, { data })
      .afterClosed()
      .subscribe(r => { if (r) this.load(); });
  }

  unassign(scholarship: ScholarshipWithCommittees, assignment: CommitteeAssignment) {
    this.svc.unassign(assignment.scholarshipCommitteeId).subscribe({
      next: () => {
        this.snack.open(`${assignment.subOrganizationName} removed from ${scholarship.scholarshipName}.`, '', { duration: 2500 });
        this.load();
      },
      error: () => this.snack.open('Could not remove assignment.', 'Close', { duration: 3000 })
    });
  }
}
