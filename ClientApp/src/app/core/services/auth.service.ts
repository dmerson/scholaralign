import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = () => this.currentUser() !== null;

  constructor(private http: HttpClient) {}

  loadCurrentUser() {
    return this.http.get<User & { isAuthenticated: boolean }>('/api/auth/info').pipe(
      tap(user => this.currentUser.set(user?.isAuthenticated ? user : null)),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      })
    );
  }

  loginWithGoogle() {
    window.location.href = '/api/auth/challenge/Google?returnUrl=/';
  }

  loginWithMicrosoft() {
    window.location.href = '/api/auth/challenge/MicrosoftAccount?returnUrl=/';
  }

  logout() {
    return this.http.post('/api/auth/logout', {}).pipe(
      tap(() => this.currentUser.set(null))
    );
  }
}
