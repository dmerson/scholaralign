import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Question, QuestionType } from '../models/question.model';

@Injectable({ providedIn: 'root' })
export class QuestionService {
  constructor(private http: HttpClient) {}

  getTypes() {
    return this.http.get<QuestionType[]>('/api/questions/types');
  }

  getAll() {
    return this.http.get<Question[]>('/api/questions');
  }

  getById(id: string) {
    return this.http.get<Question>(`/api/questions/${id}`);
  }

  create(req: Partial<Question>) {
    return this.http.post<Question>('/api/questions', req);
  }

  update(id: string, req: Partial<Question>) {
    return this.http.put<Question>(`/api/questions/${id}`, req);
  }

  delete(id: string) {
    return this.http.delete(`/api/questions/${id}`);
  }
}
