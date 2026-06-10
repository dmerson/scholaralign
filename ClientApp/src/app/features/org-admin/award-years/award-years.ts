import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AwardYear } from '../../../core/models/award-year.model';
import { Organization } from '../../../core/models/organization.model';
import { AwardYearService } from '../../../core/services/award-year.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { AwardYearDialogComponent } from '../../../shared/dialogs/award-year-dialog';

const PUBLIC_ORG_ID = '00000000-0000-0000-0000-000000000000';

@Component({
  selector: 'app-award-years',
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatSelectModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Award Years</h2>
        <div class="header-right">
          <mat-form-field appearance="outline" class="org-select">
            <mat-label>Organization</mat-label>
            <mat-select [value]="selectedOrgId()" (selectionChange)="onOrgChange($event.value)">
              @for (org of orgs(); track org.organizationId) {
                <mat-option [value]="org.organizationId">{{ org.organizationName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" [disabled]="!selectedOrgId()" (click)="openAdd()">
            <mat-icon>add</mat-icon> Add Award Year
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else if (!selectedOrgId()) {
        <p class="hint">Select an organization above to manage its award years.</p>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="awardYears()" class="full-width">
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let row">{{ row.awardYearDescription }}</td>
            </ng-container>
            <ng-container matColumnDef="year">
              <th mat-header-cell *matHeaderCellDef>Year</th>
              <td mat-cell *matCellDef="let row">{{ row.year }}</td>
            </ng-container>
            <ng-container matColumnDef="semester">
              <th mat-header-cell *matHeaderCellDef>Semester</th>
              <td mat-cell *matCellDef="let row">{{ row.semester }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="openEdit(row)" title="Edit"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="delete(row)" title="Delete"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            <tr *matNoDataRow>
              <td [attr.colspan]="cols.length" class="no-data">No award years yet. Click Add Award Year to get started.</td>
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
export class AwardYearsComponent implements OnInit {
  private svc    = inject(AwardYearService);
  private orgSvc = inject(OrganizationService);
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);

  orgs          = signal<Organization[]>([]);
  awardYears    = signal<AwardYear[]>([]);
  selectedOrgId = signal<string>('');
  loading       = signal(false);
  cols = ['description', 'year', 'semester', 'actions'];

  ngOnInit() {
    this.orgSvc.getAll().subscribe(orgs => {
      this.orgs.set(orgs.filter(o => o.organizationId !== PUBLIC_ORG_ID));
    });
  }

  onOrgChange(orgId: string) {
    this.selectedOrgId.set(orgId);
    this.load();
  }

  load() {
    const orgId = this.selectedOrgId();
    if (!orgId) return;
    this.loading.set(true);
    this.svc.getAll(orgId).subscribe({
      next: d => { this.awardYears.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    this.dialog.open(AwardYearDialogComponent, { data: { awardYear: null, organizationId: this.selectedOrgId() } })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(a: AwardYear) {
    this.dialog.open(AwardYearDialogComponent, { data: { awardYear: a, organizationId: this.selectedOrgId() } })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(a: AwardYear) {
    if (!confirm(`Delete "${a.awardYearDescription}"?`)) return;
    this.svc.delete(a.awardYearId).subscribe({
      next: () => { this.snack.open('Award year deleted.', '', { duration: 2500 }); this.load(); },
      error: e => this.snack.open(typeof e.error === 'string' ? e.error : 'Cannot delete.', 'Close', { duration: 4000 })
    });
  }
}
