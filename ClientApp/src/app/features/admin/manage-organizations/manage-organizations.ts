import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-manage-organizations',
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="page">
      <h2>Organizations</h2>
      <p>Organization management has moved to the Public Admin area.</p>
      <a mat-raised-button color="primary" routerLink="/public-admin/organizations">Go to Organizations</a>
    </div>
  `,
  styles: [`.page { padding: 24px; }`]
})
export class ManageOrganizationsComponent {}
