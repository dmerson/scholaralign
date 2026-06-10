import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-suborganizations',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Suborganizations</h2>
        <button mat-raised-button color="primary" disabled>
          <mat-icon>add</mat-icon> Add Suborganization
        </button>
      </div>
      <mat-card>
        <table mat-table [dataSource]="[]" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>
          <ng-container matColumnDef="organization">
            <th mat-header-cell *matHeaderCellDef>Organization</th>
            <td mat-cell *matCellDef="let row">{{ row.organization }}</td>
          </ng-container>
          <ng-container matColumnDef="parent">
            <th mat-header-cell *matHeaderCellDef>Parent</th>
            <td mat-cell *matCellDef="let row">{{ row.parent }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button disabled><mat-icon>edit</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          <tr *matNoDataRow>
            <td [attr.colspan]="cols.length" class="no-data">No suborganizations yet.</td>
          </tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .no-data { padding: 24px; text-align: center; color: #666; }
  `]
})
export class SubOrganizationsComponent {
  cols = ['name', 'organization', 'parent', 'actions'];
}
