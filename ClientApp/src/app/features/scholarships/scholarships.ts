import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EngineService } from '../../core/services/engine.service';
import { MyAnswer } from '../../core/models/dashboard.model';
import { Question } from '../../core/models/question.model';
import { QuestionAnswerDialogComponent } from '../../shared/dialogs/question-answer-dialog';

const TYPE_LABELS: Record<number, string> = {
  1: 'Text', 2: 'Integer', 3: 'Decimal', 4: 'Checkbox List',
  5: 'Radio List', 6: 'Dropdown', 7: 'Date', 8: 'Date & Time', 9: 'Time', 10: 'Calculated'
};

@Component({
  selector: 'app-scholarships',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
            MatProgressSpinnerModule, MatDialogModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>My Answers</h2>
        <a mat-button routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon> Dashboard
        </a>
      </div>
      <p class="hint">Your answers to eligibility questions. Edit any answer — affected scholarships are re-evaluated immediately.</p>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else if (answers().length === 0) {
        <mat-card>
          <mat-card-content>
            <p class="empty">No answers recorded yet. Use the wizard on the Dashboard to get started.</p>
            <a mat-raised-button color="primary" routerLink="/dashboard">Go to Dashboard</a>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="answers()" class="full-width">
            <ng-container matColumnDef="question">
              <th mat-header-cell *matHeaderCellDef>Question</th>
              <td mat-cell *matCellDef="let row">{{ row.questionDescription }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let row" class="type-cell">{{ typeLabel(row.questionTypeId) }}</td>
            </ng-container>
            <ng-container matColumnDef="answer">
              <th mat-header-cell *matHeaderCellDef>Your Answer</th>
              <td mat-cell *matCellDef="let row" class="answer-cell">{{ formatValue(row.answerValue) }}</td>
            </ng-container>
            <ng-container matColumnDef="modified">
              <th mat-header-cell *matHeaderCellDef>Last Updated</th>
              <td mat-cell *matCellDef="let row" class="date-cell">{{ row.lastModified.slice(0,10) }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button title="Edit answer" (click)="openEdit(row)">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 860px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .hint { color: #666; font-size: 0.9rem; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .type-cell { color: #888; font-size: 0.85rem; }
    .answer-cell { font-weight: 500; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .date-cell { color: #888; font-size: 0.85rem; white-space: nowrap; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .empty { color: #888; margin-bottom: 16px; }
  `]
})
export class ScholarshipsComponent implements OnInit {
  private authSvc   = inject(AuthService);
  private engineSvc = inject(EngineService);
  private dialog    = inject(MatDialog);

  answers = signal<MyAnswer[]>([]);
  loading = signal(true);
  cols = ['question', 'type', 'answer', 'modified', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    const email = this.authSvc.user()?.email;
    if (!email) { this.loading.set(false); return; }
    this.loading.set(true);
    this.engineSvc.getMyAnswers(email).subscribe({
      next: d => { this.answers.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openEdit(row: MyAnswer) {
    const email = this.authSvc.user()?.email;
    if (!email) return;
    const question: Question = {
      questionId: row.questionId,
      questionDescription: row.questionDescription,
      questionTypeId: row.questionTypeId,
      questionTypeAttributes: row.questionTypeAttributes,
      createdBy: '', createdOn: '', updatedBy: '', lastModified: ''
    };
    this.dialog.open(QuestionAnswerDialogComponent, {
      data: { question, currentAnswer: row.answerValue, userEmail: email }
    }).afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  typeLabel(id: number) { return TYPE_LABELS[id] ?? String(id); }

  formatValue(v: string): string {
    if (!v) return '—';
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p.join(', ');
    } catch { /* raw value */ }
    return v;
  }
}
