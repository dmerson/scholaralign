import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Scholarship, ScholarshipStatus } from '../models/scholarship.model';

@Injectable({ providedIn: 'root' })
export class ScholarshipService {
  constructor(private http: HttpClient) {}

  getAll(status?: ScholarshipStatus) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Scholarship[]>('/api/scholarships', { params });
  }

  getById(id: number) {
    return this.http.get<Scholarship>(`/api/scholarships/${id}`);
  }

  create(scholarship: Partial<Scholarship>) {
    return this.http.post<Scholarship>('/api/scholarships', scholarship);
  }

  update(id: number, scholarship: Partial<Scholarship>) {
    return this.http.put<Scholarship>(`/api/scholarships/${id}`, scholarship);
  }

  delete(id: number) {
    return this.http.delete(`/api/scholarships/${id}`);
  }
}
