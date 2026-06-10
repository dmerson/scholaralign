import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-public-award-years',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Award Years</h2>
        <button mat-raised-button color="primary" disabled>
          <mat-icon>add</mat-icon> Add Award Year
        </button>
      </div>
      <mat-card>
        <table mat-table [dataSource]="[]" class="full-width">
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let row">{{ row.description }}</td>
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
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button disabled><mat-icon>edit</mat-icon></button>
              <button mat-icon-button disabled><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          <tr *matNoDataRow>
            <td [attr.colspan]="cols.length" class="no-data">No award years yet.</td>
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
export class PublicAwardYearsComponent {
  cols = ['description', 'year', 'semester', 'actions'];
}
