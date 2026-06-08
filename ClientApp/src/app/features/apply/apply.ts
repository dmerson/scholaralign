import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScholarshipService } from '../../core/services/scholarship.service';
import { ApplicationService } from '../../core/services/application.service';
import { Scholarship } from '../../core/models/scholarship.model';

@Component({
  selector: 'app-apply',
  imports: [RouterLink, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    @if (scholarship()) {
      <div class="apply-container">
        <h2>Apply for {{ scholarship()!.title }}</h2>
        <p class="org">{{ scholarship()!.organization.name }}</p>

        <mat-card>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Essay (optional)</mat-label>
              <textarea matInput [(ngModel)]="essay" rows="10"
                placeholder="Tell us about yourself and why you deserve this scholarship..."></textarea>
            </mat-form-field>

            @if (error()) {
              <p class="error">{{ error() }}</p>
            }
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="submit()" [disabled]="submitting()">
              @if (submitting()) { <mat-spinner diameter="20" /> } @else { Submit Application }
            </button>
            <a mat-button [routerLink]="['/scholarships', scholarship()!.id]">Cancel</a>
          </mat-card-actions>
        </mat-card>
      </div>
    } @else {
      <div class="center"><mat-spinner /></div>
    }
  `,
  styles: [`
    .apply-container { max-width: 700px; }
    h2 { margin-bottom: 4px; }
    .org { color: #666; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .error { color: red; }
    .center { display: flex; justify-content: center; padding: 48px; }
    mat-card-actions { display: flex; gap: 12px; padding: 16px; }
  `]
})
export class ApplyComponent implements OnInit {
  scholarship = signal<Scholarship | null>(null);
  essay = '';
  submitting = signal(false);
  error = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private scholarshipSvc: ScholarshipService,
    private appSvc: ApplicationService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('scholarshipId'));
    this.scholarshipSvc.getById(id).subscribe(s => this.scholarship.set(s));
  }

  submit() {
    if (!this.scholarship()) return;
    this.submitting.set(true);
    this.error.set('');

    this.appSvc.submit(this.scholarship()!.id, this.essay).subscribe({
      next: () => this.router.navigate(['/my-applications']),
      error: err => {
        this.error.set(err.error || 'Failed to submit application. Please try again.');
        this.submitting.set(false);
      }
    });
  }
}
