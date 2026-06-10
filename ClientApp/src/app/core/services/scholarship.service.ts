import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Scholarship, ScholarshipStatus } from '../models/scholarship.model';

@Injectable({ providedIn: 'root' })
export class ScholarshipService {
  constructor(private http: HttpClient) {}

  getStatuses() {
    return this.http.get<ScholarshipStatus[]>('/api/scholarships/statuses');
  }

  getAll(organizationId?: string) {
    let params = new HttpParams();
    if (organizationId) params = params.set('organizationId', organizationId);
    return this.http.get<Scholarship[]>('/api/scholarships', { params });
  }

  getById(id: string) {
    return this.http.get<Scholarship>(`/api/scholarships/${id}`);
  }

  create(req: Partial<Scholarship>) {
    return this.http.post<{ scholarshipId: string }>('/api/scholarships', req);
  }

  update(id: string, req: Partial<Scholarship>) {
    return this.http.put<{ scholarshipId: string }>(`/api/scholarships/${id}`, req);
  }

  delete(id: string) {
    return this.http.delete(`/api/scholarships/${id}`);
  }
}
