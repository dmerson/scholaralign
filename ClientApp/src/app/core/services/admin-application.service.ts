import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminApplication, ApplicationQuestionRow } from '../models/admin-application.model';

@Injectable({ providedIn: 'root' })
export class AdminApplicationService {
  private http = inject(HttpClient);
  private base = '/api/applications/admin';

  getAll(organizationId?: string) {
    const params: Record<string, string> = {};
    if (organizationId) params['organizationId'] = organizationId;
    return this.http.get<AdminApplication[]>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<AdminApplication>(`${this.base}/${id}`);
  }

  create(req: { scholarshipApplicationName: string; organizationId: string; subOrganizationId?: string | null }) {
    return this.http.post<{ applicationId: string }>(this.base, req);
  }

  update(id: string, req: { scholarshipApplicationName: string; organizationId: string; subOrganizationId?: string | null }) {
    return this.http.put<{ applicationId: string }>(`${this.base}/${id}`, req);
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  getQuestions(appId: string) {
    return this.http.get<ApplicationQuestionRow[]>(`${this.base}/${appId}/questions`);
  }

  addQuestion(appId: string, questionId: string, order: number) {
    return this.http.post<{ applicationQuestionId: string }>(`${this.base}/${appId}/questions`, { questionId, order });
  }

  updateQuestionOrder(appId: string, aqId: string, order: number) {
    return this.http.put<{ applicationQuestionId: string }>(`${this.base}/${appId}/questions/${aqId}`, { order });
  }

  removeQuestion(appId: string, aqId: string) {
    return this.http.delete(`${this.base}/${appId}/questions/${aqId}`);
  }
}
