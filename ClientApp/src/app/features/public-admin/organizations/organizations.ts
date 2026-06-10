import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Organization } from '../../../core/models/organization.model';
import { OrganizationService } from '../../../core/services/organization.service';
import { OrganizationDialogComponent } from '../../../shared/dialogs/organization-dialog';

@Component({
  selector: 'app-organizations',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Organizations</h2>
        <button mat-raised-button color="primary" (click)="openAdd()">
          <mat-icon>add</mat-icon> Add Organization
        </button>
      </div>
      <p class="hint">Organizations own scholarships and users. The Public organization (id = 00000000…) cannot be deleted.</p>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="orgs()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row">{{ row.organizationName }}</td>
            </ng-container>
            <ng-container matColumnDef="contact">
              <th mat-header-cell *matHeaderCellDef>Contact</th>
              <td mat-cell *matCellDef="let row">{{ row.contact || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="website">
              <th mat-header-cell *matHeaderCellDef>Website</th>
              <td mat-cell *matCellDef="let row">{{ row.webSite || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="isPublic">
              <th mat-header-cell *matHeaderCellDef>Public</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip [color]="row.isPublic ? 'primary' : undefined">{{ row.isPublic ? 'Yes' : 'No' }}</mat-chip>
              </td>
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
              <td [attr.colspan]="cols.length" class="no-data">No organizations yet.</td>
            </tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .hint { color: #666; font-size: 0.9rem; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .no-data { padding: 24px; text-align: center; color: #666; }
    .center { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class OrganizationsComponent implements OnInit {
  private svc = inject(OrganizationService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  orgs = signal<Organization[]>([]);
  loading = signal(true);
  cols = ['name', 'contact', 'website', 'isPublic', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: d => { this.orgs.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    this.dialog.open(OrganizationDialogComponent, { data: { organization: null } })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(o: Organization) {
    this.dialog.open(OrganizationDialogComponent, { data: { organization: o } })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(o: Organization) {
    if (!confirm(`Delete "${o.organizationName}"?`)) return;
    this.svc.delete(o.organizationId).subscribe({
      next: () => { this.snack.open('Organization deleted.', '', { duration: 2500 }); this.load(); },
      error: e => this.snack.open(typeof e.error === 'string' ? e.error : 'Cannot delete.', 'Close', { duration: 4000 })
    });
  }
}
