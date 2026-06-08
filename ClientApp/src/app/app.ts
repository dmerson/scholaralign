import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor(readonly auth: AuthService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['auth']) {
        this.auth.loadCurrentUser().subscribe(() => {
          this.router.navigate([], { queryParams: {}, replaceUrl: true });
        });
      }
    });
  }

  logout() {
    this.auth.logout().subscribe(() => window.location.href = '/');
  }
}
