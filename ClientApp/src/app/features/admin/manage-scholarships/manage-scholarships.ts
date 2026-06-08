import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ScholarshipService } from '../../../core/services/scholarship.service';
import { Scholarship } from '../../../core/models/scholarship.model';

@Component({
  selector: 'app-manage-scholarships',
  imports: [FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  template: `
    <div class="header">
      <h2>Manage Scholarships</h2>
      <button mat-raised-button color="primary" disabled>
        <mat-icon>add</mat-icon> New Scholarship
      </button>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else {
      <table mat-table [dataSource]="scholarships()" class="full-width">
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let s">{{ s.title }}</td>
        </ng-container>
        <ng-container matColumnDef="organization">
          <th mat-header-cell *matHeaderCellDef>Organization</th>
          <td mat-cell *matCellDef="let s">{{ s.organization.name }}</td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>Amount</th>
          <td mat-cell *matCellDef="let s">{{ s.amount | currency }}</td>
        </ng-container>
        <ng-container matColumnDef="deadline">
          <th mat-header-cell *matHeaderCellDef>Deadline</th>
          <td mat-cell *matCellDef="let s">{{ s.deadline | date:'mediumDate' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let s">
            <mat-chip-set><mat-chip>{{ s.status }}</mat-chip></mat-chip-set>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let s">
            <button mat-icon-button color="primary" title="Edit" disabled><mat-icon>edit</mat-icon></button>
            <button mat-icon-button color="warn" title="Delete" (click)="delete(s.id)"><mat-icon>delete</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    }
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .full-width { width: 100%; }
    table { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  `]
})
export class ManageScholarshipsComponent implements OnInit {
  scholarships = signal<Scholarship[]>([]);
  loading = signal(true);
  columns = ['title', 'organization', 'amount', 'deadline', 'status', 'actions'];

  constructor(private svc: ScholarshipService) {}

  ngOnInit() {
    this.svc.getAll().subscribe({
      next: data => { this.scholarships.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  delete(id: number) {
    if (!confirm('Delete this scholarship?')) return;
    this.svc.delete(id).subscribe(() =>
      this.scholarships.update(list => list.filter(s => s.id !== id))
    );
  }
}
