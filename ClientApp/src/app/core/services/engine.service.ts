import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DashboardData } from '../models/dashboard.model';
import { Question } from '../models/question.model';

@Injectable({ providedIn: 'root' })
export class EngineService {
  private http = inject(HttpClient);

  sync(userEmail: string) {
    return this.http.post<{ synced: boolean }>('/api/engine/sync', { userEmail });
  }

  getDashboard(userEmail: string) {
    return this.http.get<DashboardData>(`/api/engine/dashboard/${encodeURIComponent(userEmail)}`);
  }

  getNextQuestion(userEmail: string) {
    return this.http.get<Question | null>(`/api/engine/next-question/${encodeURIComponent(userEmail)}`);
  }

  saveAnswer(userEmail: string, questionId: string, answerValue: string) {
    return this.http.post<{ saved: boolean }>('/api/engine/answer', { userEmail, questionId, answerValue });
  }
}
