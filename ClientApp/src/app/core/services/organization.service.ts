import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Organization } from '../models/organization.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private http = inject(HttpClient);
  private base = '/api/organizations';

  getAll() { return this.http.get<Organization[]>(this.base); }
  getById(id: string) { return this.http.get<Organization>(`${this.base}/${id}`); }
  create(req: Partial<Organization>) { return this.http.post<{ organizationId: string }>(this.base, req); }
  update(id: string, req: Partial<Organization>) { return this.http.put<{ organizationId: string }>(`${this.base}/${id}`, req); }
  delete(id: string) { return this.http.delete(`${this.base}/${id}`); }
}
