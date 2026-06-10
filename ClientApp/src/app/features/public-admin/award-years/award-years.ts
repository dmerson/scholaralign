import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AwardYear } from '../../../core/models/award-year.model';
import { AwardYearService } from '../../../core/services/award-year.service';
import { AwardYearDialogComponent } from '../../../shared/dialogs/award-year-dialog';

const PUBLIC_ORG_ID = '00000000-0000-0000-0000-000000000000';

@Component({
  selector: 'app-public-award-years',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Award Years</h2>
        <button mat-raised-button color="primary" (click)="openAdd()">
          <mat-icon>add</mat-icon> Add Award Year
        </button>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
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
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .no-data { padding: 24px; text-align: center; color: #666; }
    .center { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class PublicAwardYearsComponent implements OnInit {
  private svc = inject(AwardYearService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  awardYears = signal<AwardYear[]>([]);
  loading = signal(true);
  cols = ['description', 'year', 'semester', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll(PUBLIC_ORG_ID).subscribe({
      next: d => { this.awardYears.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    this.dialog.open(AwardYearDialogComponent, { data: { awardYear: null, organizationId: PUBLIC_ORG_ID } })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(a: AwardYear) {
    this.dialog.open(AwardYearDialogComponent, { data: { awardYear: a, organizationId: PUBLIC_ORG_ID } })
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
