import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Organization } from '../../../core/models/organization.model';
import { OrgUser, OrgRoleName, OrgUserRole } from '../../../core/models/org-user.model';
import { OrganizationService } from '../../../core/services/organization.service';
import { OrgUsersService } from '../../../core/services/org-users.service';
import { AddUserDialogComponent } from '../../../shared/dialogs/add-user-dialog';
import { AddRoleDialogComponent, AddRoleDialogData } from '../../../shared/dialogs/add-role-dialog';

@Component({
  selector: 'app-users-roles',
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatFormFieldModule, MatSelectModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Users &amp; Roles</h2>
        <div class="header-right">
          <mat-form-field appearance="outline" class="org-select">
            <mat-label>Organization</mat-label>
            <mat-select [value]="selectedOrgId()" (selectionChange)="onOrgChange($event.value)">
              @for (org of orgs(); track org.organizationId) {
                <mat-option [value]="org.organizationId">{{ org.organizationName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" [disabled]="!selectedOrgId()" (click)="openAddUser()">
            <mat-icon>person_add</mat-icon> Add User
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else if (!selectedOrgId()) {
        <p class="hint">Select an organization above to manage its members and roles.</p>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="users()" class="full-width">

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let user">{{ user.userEmail }}</td>
            </ng-container>

            <ng-container matColumnDef="roles">
              <th mat-header-cell *matHeaderCellDef>Roles</th>
              <td mat-cell *matCellDef="let user">
                <div class="roles-cell">
                  <mat-chip-set>
                    @for (role of user.roles; track role.organizationRoleId) {
                      <mat-chip (removed)="removeRole(user, role)">
                        {{ role.organizationRoleNameDescription }}
                        <button matChipRemove aria-label="Remove role"><mat-icon>cancel</mat-icon></button>
                      </mat-chip>
                    }
                  </mat-chip-set>
                  <button mat-stroked-button class="add-role-btn" (click)="openAddRole(user)">
                    <mat-icon>add</mat-icon> Role
                  </button>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let user" class="actions-cell">
                <button mat-icon-button color="warn" (click)="removeUser(user)" title="Remove from organization">
                  <mat-icon>person_remove</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            <tr *matNoDataRow>
              <td [attr.colspan]="cols.length" class="no-data">
                No users yet. Click Add User to add someone to this organization.
              </td>
            </tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .org-select { min-width: 220px; margin-bottom: -1.25em; }
    .full-width { width: 100%; }
    .no-data { padding: 24px; text-align: center; color: #666; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .hint { color: #666; }
    .roles-cell { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 4px 0; }
    .add-role-btn { height: 32px; line-height: 32px; font-size: 12px; }
    .actions-cell { text-align: right; white-space: nowrap; }
  `]
})
export class UsersRolesComponent implements OnInit {
  private orgSvc  = inject(OrganizationService);
  private svc     = inject(OrgUsersService);
  private dialog  = inject(MatDialog);
  private snack   = inject(MatSnackBar);

  orgs           = signal<Organization[]>([]);
  users          = signal<OrgUser[]>([]);
  roleNames      = signal<OrgRoleName[]>([]);
  selectedOrgId  = signal<string>('');
  loading        = signal(false);

  cols = ['email', 'roles', 'actions'];

  ngOnInit() {
    this.orgSvc.getAll().subscribe(orgs => this.orgs.set(orgs));
    this.svc.getRoleNames().subscribe(rn => this.roleNames.set(rn));
  }

  onOrgChange(orgId: string) {
    this.selectedOrgId.set(orgId);
    this.loadUsers();
  }

  loadUsers() {
    const orgId = this.selectedOrgId();
    if (!orgId) return;
    this.loading.set(true);
    this.svc.getUsers(orgId).subscribe({
      next: u => { this.users.set(u); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAddUser() {
    this.dialog
      .open(AddUserDialogComponent, { data: this.selectedOrgId() })
      .afterClosed()
      .subscribe(r => { if (r) this.loadUsers(); });
  }

  openAddRole(user: OrgUser) {
    const data: AddRoleDialogData = { user, availableRoles: this.roleNames() };
    this.dialog
      .open(AddRoleDialogComponent, { data })
      .afterClosed()
      .subscribe(r => { if (r) this.loadUsers(); });
  }

  removeRole(user: OrgUser, role: OrgUserRole) {
    this.svc.removeRole(user.organizationUserId, role.organizationRoleId).subscribe({
      next: () => {
        this.snack.open('Role removed.', '', { duration: 2000 });
        this.loadUsers();
      },
      error: () => this.snack.open('Could not remove role.', 'Close', { duration: 3000 })
    });
  }

  removeUser(user: OrgUser) {
    if (!confirm(`Remove ${user.userEmail} from this organization? Their roles will also be removed.`)) return;
    this.svc.removeUser(user.organizationUserId).subscribe({
      next: () => {
        this.snack.open('User removed.', '', { duration: 2000 });
        this.loadUsers();
      },
      error: () => this.snack.open('Could not remove user.', 'Close', { duration: 3000 })
    });
  }
}
