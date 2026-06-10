import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserApplicationSummary, UserApplicationDetail } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class UserApplicationService {
  private http = inject(HttpClient);
  private base = '/api/user-applications';

  getMyApplications(userEmail: string) {
    return this.http.get<UserApplicationSummary[]>(`${this.base}/${enc(userEmail)}`);
  }

  getDetail(userEmail: string, scholarshipId: string) {
    return this.http.get<UserApplicationDetail>(`${this.base}/${enc(userEmail)}/${scholarshipId}`);
  }

  saveAnswer(userEmail: string, scholarshipId: string, applicationQuestionId: string, answerValue: string) {
    return this.http.post<{ saved: boolean }>(`${this.base}/answer`,
      { userEmail, scholarshipId, applicationQuestionId, answerValue });
  }

  submit(userEmail: string, scholarshipId: string) {
    return this.http.post<{ submitted: boolean; submittedDate: string }>(`${this.base}/submit`,
      { userEmail, scholarshipId });
  }
}

function enc(s: string) { return encodeURIComponent(s); }
