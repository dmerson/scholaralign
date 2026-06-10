import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-application-detail',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page">
      <h2>Application Form</h2>
      <p class="hint">Answer each question and submit when complete. You can return and update answers before submitting.</p>
      <mat-card>
        <mat-card-content>
          <p class="coming-soon">Application form coming soon.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    h2 { margin-bottom: 8px; }
    .hint { color: #666; margin-bottom: 24px; }
    .coming-soon { color: #999; font-style: italic; }
  `]
})
export class ApplicationDetailComponent {}
