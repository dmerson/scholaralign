import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrgUser, OrgRoleName } from '../models/org-user.model';

@Injectable({ providedIn: 'root' })
export class OrgUsersService {
  private http = inject(HttpClient);
  private base = '/api/org-users';

  getRoleNames() {
    return this.http.get<OrgRoleName[]>(`${this.base}/role-names`);
  }

  getUsers(organizationId: string) {
    return this.http.get<OrgUser[]>(`${this.base}?organizationId=${organizationId}`);
  }

  addUser(organizationId: string, userEmail: string) {
    return this.http.post<{ organizationUserId: string }>(this.base, { organizationId, userEmail });
  }

  removeUser(organizationUserId: string) {
    return this.http.delete(`${this.base}/${organizationUserId}`);
  }

  addRole(organizationUserId: string, organizationRoleNameId: number) {
    return this.http.post<{ organizationRoleId: string }>(
      `${this.base}/${organizationUserId}/roles`,
      { organizationRoleNameId }
    );
  }

  removeRole(organizationUserId: string, organizationRoleId: string) {
    return this.http.delete(`${this.base}/${organizationUserId}/roles/${organizationRoleId}`);
  }
}
