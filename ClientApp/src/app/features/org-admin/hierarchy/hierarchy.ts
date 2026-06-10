import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Organization } from '../../../core/models/organization.model';
import { SubOrganization } from '../../../core/models/sub-organization.model';
import { OrganizationService } from '../../../core/services/organization.service';
import { SubOrganizationService } from '../../../core/services/sub-organization.service';
import { SubOrganizationDialogComponent } from '../../../shared/dialogs/sub-organization-dialog';

const PUBLIC_ORG_ID = '00000000-0000-0000-0000-000000000000';

interface Crumb { id: string | null; name: string; }

@Component({
  selector: 'app-hierarchy',
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatSelectModule, MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Organization Hierarchy</h2>
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
            <mat-icon>add</mat-icon> Add {{ crumbs().length > 1 ? 'Child' : 'Suborganization' }}
          </button>
        </div>
      </div>

      <nav class="breadcrumb">
        @for (crumb of crumbs(); track crumb.id; let last = $last) {
          @if (!last) {
            <button mat-button class="crumb-btn" (click)="navigateTo(crumb)">{{ crumb.name }}</button>
            <span class="crumb-sep">›</span>
          } @else {
            <span class="crumb-current">{{ crumb.name }}</span>
          }
        }
      </nav>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else if (!selectedOrgId) {
        <p class="hint">Select an organization above to view its suborganizations.</p>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="visibleRows()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row">{{ row.subOrganizationName }}</td>
            </ng-container>
            <ng-container matColumnDef="parent">
              <th mat-header-cell *matHeaderCellDef>Parent</th>
              <td mat-cell *matCellDef="let row">{{ row.parentName || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="children">
              <th mat-header-cell *matHeaderCellDef>Children</th>
              <td mat-cell *matCellDef="let row">
                @if ((row.childCount ?? 0) > 0) {
                  <button mat-button color="primary" (click)="drillDown(row)">
                    {{ row.childCount }} <mat-icon inline>chevron_right</mat-icon>
                  </button>
                } @else {
                  <span class="none">—</span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="openEdit(row)" title="Edit"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button (click)="openAddChild(row)" title="Add child"><mat-icon>add_circle_outline</mat-icon></button>
                <button mat-icon-button color="warn" (click)="delete(row)" title="Delete"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            <tr *matNoDataRow>
              <td [attr.colspan]="cols.length" class="no-data">No suborganizations at this level.</td>
            </tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 16px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .org-select { min-width: 220px; }
    .breadcrumb { display: flex; align-items: center; gap: 4px; margin-bottom: 16px; min-height: 36px; }
    .crumb-btn { min-width: 0; padding: 0 6px; font-size: 0.9rem; }
    .crumb-sep { color: #aaa; }
    .crumb-current { font-size: 0.9rem; font-weight: 500; padding: 0 6px; }
    .hint { color: #888; font-style: italic; }
    .full-width { width: 100%; }
    .no-data { padding: 24px; text-align: center; color: #666; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .none { color: #bbb; }
  `]
})
export class HierarchyComponent implements OnInit {
  private orgSvc = inject(OrganizationService);
  private svc    = inject(SubOrganizationService);
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);

  orgs       = signal<Organization[]>([]);
  allSubOrgs = signal<SubOrganization[]>([]);
  loading    = signal(false);
  selectedOrgId = '';
  crumbs     = signal<Crumb[]>([{ id: null, name: 'Root' }]);
  cols = ['name', 'parent', 'children', 'actions'];

  currentParentId = computed(() => this.crumbs()[this.crumbs().length - 1].id);
  visibleRows     = computed(() =>
    this.allSubOrgs().filter(s => (s.subOrganizationParentId ?? null) === this.currentParentId())
  );

  ngOnInit() {
    this.orgSvc.getAll().subscribe(orgs =>
      this.orgs.set(orgs.filter(o => o.organizationId !== PUBLIC_ORG_ID))
    );
  }

  onOrgChange() {
    this.crumbs.set([{ id: null, name: 'Root' }]);
    this.load();
  }

  load() {
    if (!this.selectedOrgId) return;
    this.loading.set(true);
    this.svc.getAll(this.selectedOrgId).subscribe({
      next: d => { this.allSubOrgs.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  drillDown(row: SubOrganization) {
    this.crumbs.update(c => [...c, { id: row.subOrganizationId, name: row.subOrganizationName }]);
  }

  navigateTo(crumb: Crumb) {
    const idx = this.crumbs().findIndex(c => c.id === crumb.id);
    this.crumbs.update(c => c.slice(0, idx + 1));
  }

  openAdd() {
    this.dialog.open(SubOrganizationDialogComponent, {
      data: { subOrganization: null, organizationId: this.selectedOrgId, peers: this.allSubOrgs(), defaultParentId: this.currentParentId() }
    }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openAddChild(row: SubOrganization) {
    this.dialog.open(SubOrganizationDialogComponent, {
      data: { subOrganization: null, organizationId: this.selectedOrgId, peers: this.allSubOrgs(), defaultParentId: row.subOrganizationId }
    }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(row: SubOrganization) {
    this.dialog.open(SubOrganizationDialogComponent, {
      data: { subOrganization: row, organizationId: this.selectedOrgId, peers: this.allSubOrgs(), defaultParentId: null }
    }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(row: SubOrganization) {
    if (!confirm(`Delete "${row.subOrganizationName}"?`)) return;
    this.svc.delete(row.subOrganizationId).subscribe({
      next: () => { this.snack.open('Deleted.', '', { duration: 2500 }); this.load(); },
      error: e => this.snack.open(typeof e.error === 'string' ? e.error : 'Cannot delete.', 'Close', { duration: 4000 })
    });
  }
}
