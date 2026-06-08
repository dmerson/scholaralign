import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ScholarshipApplication, ApplicationStatus } from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  constructor(private http: HttpClient) {}

  getMyApplications() {
    return this.http.get<ScholarshipApplication[]>('/api/applications/mine');
  }

  getAllApplications(status?: ApplicationStatus) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ScholarshipApplication[]>('/api/applications', { params });
  }

  submit(scholarshipId: number, essay?: string) {
    return this.http.post<ScholarshipApplication>('/api/applications', { scholarshipId, essay });
  }

  review(id: number, status: ApplicationStatus, notes?: string) {
    return this.http.patch<ScholarshipApplication>(`/api/applications/${id}/review`, { status, notes });
  }
}
