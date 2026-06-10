import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-requirements',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Scholarship Requirements</h2>
        <button mat-raised-button color="primary" disabled>
          <mat-icon>add</mat-icon> Add Requirement
        </button>
      </div>
      <p class="hint">Define eligibility rules for this scholarship. Each requirement is a Question + Operator + Value combination. Requirements in the same group must all be true. Any group being fully true makes the user eligible.</p>
      <mat-card>
        <table mat-table [dataSource]="[]" class="full-width">
          <ng-container matColumnDef="question">
            <th mat-header-cell *matHeaderCellDef>Question</th>
            <td mat-cell *matCellDef="let row">{{ row.question }}</td>
          </ng-container>
          <ng-container matColumnDef="operator">
            <th mat-header-cell *matHeaderCellDef>Operator</th>
            <td mat-cell *matCellDef="let row">{{ row.operator }}</td>
          </ng-container>
          <ng-container matColumnDef="value">
            <th mat-header-cell *matHeaderCellDef>Value</th>
            <td mat-cell *matCellDef="let row">{{ row.value }}</td>
          </ng-container>
          <ng-container matColumnDef="grouping">
            <th mat-header-cell *matHeaderCellDef>Group</th>
            <td mat-cell *matCellDef="let row">{{ row.grouping }}</td>
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
            <td [attr.colspan]="cols.length" class="no-data">No requirements yet.</td>
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
export class RequirementsComponent {
  cols = ['question', 'operator', 'value', 'grouping', 'actions'];
}
