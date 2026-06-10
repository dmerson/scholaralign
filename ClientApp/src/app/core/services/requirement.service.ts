import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Operator, Requirement } from '../models/requirement.model';

@Injectable({ providedIn: 'root' })
export class RequirementService {
  private http = inject(HttpClient);
  private base = '/api/requirements';

  getOperators() { return this.http.get<Operator[]>(`${this.base}/operators`); }
  getAll(scholarshipId: string) { return this.http.get<Requirement[]>(`${this.base}?scholarshipId=${scholarshipId}`); }
  getById(id: string) { return this.http.get<Requirement>(`${this.base}/${id}`); }
  create(req: Partial<Requirement>) { return this.http.post<{ scholarshipRequirementId: string }>(this.base, req); }
  update(id: string, req: Partial<Requirement>) { return this.http.put(`${this.base}/${id}`, req); }
  delete(id: string) { return this.http.delete(`${this.base}/${id}`); }
}
