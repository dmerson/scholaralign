import { Component, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../../core/services/application.service';
import { ScholarshipApplication, ApplicationStatus } from '../../../core/models/application.model';

@Component({
  selector: 'app-manage-applications',
  imports: [FormsModule, MatTableModule, MatButtonModule, MatChipsModule,
    MatSelectModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <h2>Review Applications</h2>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else {
      <table mat-table [dataSource]="applications()" class="full-width">
        <ng-container matColumnDef="scholarship">
          <th mat-header-cell *matHeaderCellDef>Scholarship</th>
          <td mat-cell *matCellDef="let a">{{ a.scholarship.title }}</td>
        </ng-container>
        <ng-container matColumnDef="submitted">
          <th mat-header-cell *matHeaderCellDef>Submitted</th>
          <td mat-cell *matCellDef="let a">{{ a.submittedAt | date:'mediumDate' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let a">
            <mat-chip-set><mat-chip>{{ a.status }}</mat-chip></mat-chip-set>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let a">
            <button mat-stroked-button color="primary" (click)="review(a, 'Accepted')">Accept</button>
            <button mat-stroked-button color="warn" (click)="review(a, 'Rejected')">Reject</button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    }
  `,
  styles: [`
    h2 { margin-bottom: 24px; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .full-width { width: 100%; }
    table { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    [mat-stroked-button] { margin-right: 8px; }
  `]
})
export class ManageApplicationsComponent implements OnInit {
  applications = signal<ScholarshipApplication[]>([]);
  loading = signal(true);
  columns = ['scholarship', 'submitted', 'status', 'actions'];

  constructor(private svc: ApplicationService) {}

  ngOnInit() {
    this.svc.getAllApplications().subscribe({
      next: data => { this.applications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  review(app: ScholarshipApplication, status: ApplicationStatus) {
    this.svc.review(app.id, status).subscribe(updated =>
      this.applications.update(list => list.map(a => a.id === updated.id ? updated : a))
    );
  }
}
