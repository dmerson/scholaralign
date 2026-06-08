import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Sign In to ScholarAlign</mat-card-title>
          <mat-card-subtitle>Discover and apply for scholarships</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="providers">
            <button mat-stroked-button (click)="auth.loginWithGoogle()">
              <mat-icon svgIcon="google"></mat-icon>
              Continue with Google
            </button>
            <button mat-stroked-button (click)="auth.loginWithMicrosoft()">
              <mat-icon>window</mat-icon>
              Continue with Microsoft
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      padding: 64px 16px;
    }
    mat-card { max-width: 400px; width: 100%; }
    mat-card-content { padding-top: 16px; }
    .providers {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    button { width: 100%; justify-content: center; }
  `]
})
export class LoginComponent {
  constructor(readonly auth: AuthService) {}
}
