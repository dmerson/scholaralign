import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrganizationService } from '../../../core/services/organization.service';
import { Organization } from '../../../core/models/organization.model';

@Component({
  selector: 'app-manage-organizations',
  imports: [FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="header">
      <h2>Organizations</h2>
      <button mat-raised-button color="primary" (click)="showForm.set(!showForm())">
        <mat-icon>add</mat-icon> New Organization
      </button>
    </div>

    @if (showForm()) {
      <mat-card class="form-card">
        <mat-card-content>
          <mat-form-field appearance="outline"><mat-label>Name</mat-label>
            <input matInput [(ngModel)]="form.name" required />
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Description</mat-label>
            <input matInput [(ngModel)]="form.description" />
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Website</mat-label>
            <input matInput [(ngModel)]="form.website" />
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Contact Email</mat-label>
            <input matInput [(ngModel)]="form.contactEmail" />
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="save()">Save</button>
          <button mat-button (click)="showForm.set(false)">Cancel</button>
        </mat-card-actions>
      </mat-card>
    }

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else {
      <table mat-table [dataSource]="organizations()" class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let o">{{ o.name }}</td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Contact</th>
          <td mat-cell *matCellDef="let o">{{ o.contactEmail }}</td>
        </ng-container>
        <ng-container matColumnDef="website">
          <th mat-header-cell *matHeaderCellDef>Website</th>
          <td mat-cell *matCellDef="let o">{{ o.website }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o">
            <button mat-icon-button color="warn" (click)="delete(o.id)"><mat-icon>delete</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    }
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .form-card { margin-bottom: 24px; }
    mat-form-field { width: 100%; margin-bottom: 8px; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .full-width { width: 100%; }
    mat-card-actions { display: flex; gap: 8px; padding: 16px; }
  `]
})
export class ManageOrganizationsComponent implements OnInit {
  organizations = signal<Organization[]>([]);
  loading = signal(true);
  showForm = signal(false);
  form: Partial<Organization> = {};
  columns = ['name', 'email', 'website', 'actions'];

  constructor(private svc: OrganizationService) {}

  ngOnInit() {
    this.svc.getAll().subscribe({
      next: data => { this.organizations.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  save() {
    this.svc.create(this.form).subscribe(org => {
      this.organizations.update(list => [...list, org]);
      this.form = {};
      this.showForm.set(false);
    });
  }

  delete(id: number) {
    if (!confirm('Delete this organization?')) return;
    this.svc.delete(id).subscribe(() =>
      this.organizations.update(list => list.filter(o => o.id !== id))
    );
  }
}
