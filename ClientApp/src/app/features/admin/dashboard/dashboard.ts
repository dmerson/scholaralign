import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <h2>Admin Dashboard</h2>
    <div class="grid">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>school</mat-icon>
          <mat-card-title>Scholarships</mat-card-title>
        </mat-card-header>
        <mat-card-content><p>Create and manage scholarship listings.</p></mat-card-content>
        <mat-card-actions>
          <a mat-button color="primary" routerLink="/admin/scholarships">Manage</a>
        </mat-card-actions>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>assignment</mat-icon>
          <mat-card-title>Applications</mat-card-title>
        </mat-card-header>
        <mat-card-content><p>Review and process student applications.</p></mat-card-content>
        <mat-card-actions>
          <a mat-button color="primary" routerLink="/admin/applications">Review</a>
        </mat-card-actions>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>business</mat-icon>
          <mat-card-title>Organizations</mat-card-title>
        </mat-card-header>
        <mat-card-content><p>Manage scholarship-providing organizations.</p></mat-card-content>
        <mat-card-actions>
          <a mat-button color="primary" routerLink="/admin/organizations">Manage</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    h2 { margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    mat-icon[mat-card-avatar] { font-size: 40px; height: 40px; width: 40px; color: #1976d2; }
  `]
})
export class DashboardComponent {}
