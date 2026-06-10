import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DashboardData, MyAnswer, ScholarshipDetailResponse } from '../models/dashboard.model';
import { Question } from '../models/question.model';

@Injectable({ providedIn: 'root' })
export class EngineService {
  private http = inject(HttpClient);

  sync(userEmail: string) {
    return this.http.post<{ synced: boolean }>('/api/engine/sync', { userEmail });
  }

  getDashboard(userEmail: string) {
    return this.http.get<DashboardData>(`/api/engine/dashboard/${enc(userEmail)}`);
  }

  getNextQuestion(userEmail: string) {
    return this.http.get<Question | null>(`/api/engine/next-question/${enc(userEmail)}`);
  }

  saveAnswer(userEmail: string, questionId: string, answerValue: string) {
    return this.http.post<{ saved: boolean }>('/api/engine/answer', { userEmail, questionId, answerValue });
  }

  getMyAnswers(userEmail: string) {
    return this.http.get<MyAnswer[]>(`/api/engine/my-answers/${enc(userEmail)}`);
  }

  getScholarshipDetail(userEmail: string, scholarshipId: string) {
    return this.http.get<ScholarshipDetailResponse>(
      `/api/engine/scholarship-detail/${enc(userEmail)}/${scholarshipId}`
    );
  }
}

function enc(s: string) { return encodeURIComponent(s); }
