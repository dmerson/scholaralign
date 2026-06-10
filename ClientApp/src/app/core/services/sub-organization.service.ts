import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SubOrganization } from '../models/sub-organization.model';

@Injectable({ providedIn: 'root' })
export class SubOrganizationService {
  private http = inject(HttpClient);
  private base = '/api/suborganizations';

  getAll(organizationId: string) { return this.http.get<SubOrganization[]>(`${this.base}?organizationId=${organizationId}`); }
  getById(id: string) { return this.http.get<SubOrganization>(`${this.base}/${id}`); }
  create(req: Partial<SubOrganization>) { return this.http.post<{ subOrganizationId: string }>(this.base, req); }
  update(id: string, req: Partial<SubOrganization>) { return this.http.put<{ subOrganizationId: string }>(`${this.base}/${id}`, req); }
  delete(id: string) { return this.http.delete(`${this.base}/${id}`); }
}
