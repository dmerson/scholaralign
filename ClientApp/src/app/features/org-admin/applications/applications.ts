import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminApplication } from '../../../core/models/admin-application.model';
import { Organization } from '../../../core/models/organization.model';
import { AdminApplicationService } from '../../../core/services/admin-application.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { ApplicationDialogComponent } from '../../../shared/dialogs/application-dialog';

@Component({
  selector: 'app-org-applications',
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
            MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Applications</h2>
        <button mat-raised-button color="primary" (click)="openAdd()">
          <mat-icon>add</mat-icon> New Application
        </button>
      </div>
      <p class="hint">Applications are sets of questions presented to scholarship applicants. Link an application to a scholarship to collect structured answers.</p>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="apps()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row">{{ row.scholarshipApplicationName }}</td>
            </ng-container>
            <ng-container matColumnDef="org">
              <th mat-header-cell *matHeaderCellDef>Organization</th>
              <td mat-cell *matCellDef="let row">{{ row.orgName }}</td>
            </ng-container>
            <ng-container matColumnDef="suborg">
              <th mat-header-cell *matHeaderCellDef>Sub-Org</th>
              <td mat-cell *matCellDef="let row" class="muted">{{ row.subOrgName || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="questions">
              <th mat-header-cell *matHeaderCellDef>Questions</th>
              <td mat-cell *matCellDef="let row">
                <a mat-button [routerLink]="['/org-admin/applications', row.applicationId, 'questions']"
                   class="q-link">
                  <mat-icon>list</mat-icon> {{ row.questionCount }}
                </a>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button title="Edit" (click)="openEdit(row)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" title="Delete" (click)="delete(row)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            <tr *matNoDataRow>
              <td [attr.colspan]="cols.length" class="no-data">No applications yet. Click New Application to get started.</td>
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
    .muted { color: #888; }
    .q-link { min-width: 0; }
  `]
})
export class OrgApplicationsComponent implements OnInit {
  private svc    = inject(AdminApplicationService);
  private orgSvc = inject(OrganizationService);
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);

  apps  = signal<AdminApplication[]>([]);
  orgs  = signal<Organization[]>([]);
  loading = signal(true);
  cols = ['name', 'org', 'suborg', 'questions', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.orgSvc.getAll().subscribe(o => this.orgs.set(o));
    this.svc.getAll().subscribe({
      next: d => { this.apps.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    this.dialog.open(ApplicationDialogComponent, {
      data: { application: null, organizations: this.orgs() }
    }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(app: AdminApplication) {
    this.dialog.open(ApplicationDialogComponent, {
      data: { application: app, organizations: this.orgs() }
    }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(app: AdminApplication) {
    if (!confirm(`Delete "${app.scholarshipApplicationName}"?`)) return;
    this.svc.delete(app.applicationId).subscribe({
      next: () => { this.snack.open('Application deleted.', '', { duration: 2500 }); this.load(); },
      error: e => this.snack.open(typeof e.error === 'string' ? e.error : 'Cannot delete.', 'Close', { duration: 4000 })
    });
  }
}
