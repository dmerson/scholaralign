import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-scholarships',
  imports: [MatTabsModule, MatCardModule, MatIconModule],
  template: `
    <div class="page">
      <h2>My Scholarships</h2>
      <mat-tab-group>
        <mat-tab label="Eligible">
          <div class="tab-content">
            <p class="empty-msg">
              <mat-icon>check_circle</mat-icon>
              No eligible scholarships yet. Complete the wizard on your Dashboard to see results.
            </p>
          </div>
        </mat-tab>
        <mat-tab label="Unknown">
          <div class="tab-content">
            <p class="empty-msg">
              <mat-icon>help_outline</mat-icon>
              No unknown scholarships. Complete the wizard to evaluate all available scholarships.
            </p>
          </div>
        </mat-tab>
        <mat-tab label="Ineligible">
          <div class="tab-content">
            <p class="empty-msg">
              <mat-icon>cancel</mat-icon>
              No ineligible scholarships.
            </p>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    h2 { margin-bottom: 24px; }
    .tab-content { padding: 24px 0; }
    .empty-msg { display: flex; align-items: center; gap: 8px; color: #666; }
    mat-icon { vertical-align: middle; }
  `]
})
export class ScholarshipsComponent {}
