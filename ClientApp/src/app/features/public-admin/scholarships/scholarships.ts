import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-public-scholarships',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Public Scholarships</h2>
        <button mat-raised-button color="primary" disabled>
          <mat-icon>add</mat-icon> Create Scholarship
        </button>
      </div>
      <p class="hint">Scholarships visible to all users regardless of organization membership. Deleting the last scholarship for an abstract also deletes the abstract.</p>
      <mat-card>
        <table mat-table [dataSource]="[]" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>
          <ng-container matColumnDef="awardYear">
            <th mat-header-cell *matHeaderCellDef>Award Year</th>
            <td mat-cell *matCellDef="let row">{{ row.awardYear }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip>{{ row.status }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button disabled><mat-icon>edit</mat-icon></button>
              <button mat-icon-button disabled><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          <tr *matNoDataRow>
            <td [attr.colspan]="cols.length" class="no-data">No public scholarships yet.</td>
          </tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .hint { color: #666; margin-bottom: 24px; font-size: 0.9rem; }
    .full-width { width: 100%; }
    .no-data { padding: 24px; text-align: center; color: #666; }
  `]
})
export class PublicScholarshipsComponent {
  cols = ['name', 'awardYear', 'status', 'actions'];
}
