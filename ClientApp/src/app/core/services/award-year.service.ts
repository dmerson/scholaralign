import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AwardYear } from '../models/award-year.model';

@Injectable({ providedIn: 'root' })
export class AwardYearService {
  constructor(private http: HttpClient) {}

  getAll(organizationId?: string) {
    let params = new HttpParams();
    if (organizationId) params = params.set('organizationId', organizationId);
    return this.http.get<AwardYear[]>('/api/awardyears', { params });
  }

  getById(id: string) {
    return this.http.get<AwardYear>(`/api/awardyears/${id}`);
  }

  create(req: Partial<AwardYear>) {
    return this.http.post<AwardYear>('/api/awardyears', req);
  }

  update(id: string, req: Partial<AwardYear>) {
    return this.http.put<AwardYear>(`/api/awardyears/${id}`, req);
  }

  delete(id: string) {
    return this.http.delete(`/api/awardyears/${id}`);
  }
}
