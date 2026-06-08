import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Organization } from '../models/organization.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Organization[]>('/api/organizations');
  }

  getById(id: number) {
    return this.http.get<Organization>(`/api/organizations/${id}`);
  }

  create(org: Partial<Organization>) {
    return this.http.post<Organization>('/api/organizations', org);
  }

  update(id: number, org: Partial<Organization>) {
    return this.http.put<Organization>(`/api/organizations/${id}`, org);
  }

  delete(id: number) {
    return this.http.delete(`/api/organizations/${id}`);
  }
}
