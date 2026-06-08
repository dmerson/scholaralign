import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <section class="hero">
      <h1>Find Your Perfect Scholarship</h1>
      <p>ScholarAlign matches students with scholarship opportunities tailored to their goals and eligibility.</p>
      <div class="actions">
        <a routerLink="/scholarships" mat-raised-button color="primary">Browse Scholarships</a>
        <a routerLink="/login" mat-stroked-button>Sign In to Apply</a>
      </div>
    </section>

    <section class="features">
      <div class="feature">
        <mat-icon>search</mat-icon>
        <h3>Discover</h3>
        <p>Browse scholarships from organizations across the country.</p>
      </div>
      <div class="feature">
        <mat-icon>assignment</mat-icon>
        <h3>Apply</h3>
        <p>Submit your application in minutes with a simple, guided process.</p>
      </div>
      <div class="feature">
        <mat-icon>notifications</mat-icon>
        <h3>Track</h3>
        <p>Stay updated on your application status in real time.</p>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      text-align: center;
      padding: 80px 24px;
      h1 { font-size: 2.5rem; margin-bottom: 16px; }
      p { font-size: 1.1rem; color: #555; margin-bottom: 32px; }
      .actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 32px;
      padding: 32px 0;
    }
    .feature {
      text-align: center;
      mat-icon { font-size: 48px; height: 48px; width: 48px; color: #1976d2; }
      h3 { margin: 12px 0 8px; }
      p { color: #666; }
    }
  `]
})
export class HomeComponent {}
