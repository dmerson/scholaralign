import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Question, QuestionType } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';
import { QuestionDialogComponent } from '../../../shared/dialogs/question-dialog';

@Component({
  selector: 'app-questions',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Questions</h2>
        <button mat-raised-button color="primary" (click)="openAdd()">
          <mat-icon>add</mat-icon> Add Question
        </button>
      </div>
      <p class="hint">Questions are answered by users in the eligibility wizard and used as the basis for scholarship requirements.</p>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="questions()" class="full-width">
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Question</th>
              <td mat-cell *matCellDef="let row">{{ row.questionDescription }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let row">{{ row.questionTypeName }}</td>
            </ng-container>
            <ng-container matColumnDef="order">
              <th mat-header-cell *matHeaderCellDef>Order</th>
              <td mat-cell *matCellDef="let row">{{ row.questionOrder ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="openEdit(row)" title="Edit"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="delete(row)" title="Delete"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            <tr *matNoDataRow>
              <td [attr.colspan]="cols.length" class="no-data">No questions yet. Click Add Question to get started.</td>
            </tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .hint { color: #666; font-size: 0.9rem; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .no-data { padding: 24px; text-align: center; color: #666; }
    .center { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class QuestionsComponent implements OnInit {
  private svc = inject(QuestionService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  questions = signal<Question[]>([]);
  types = signal<QuestionType[]>([]);
  loading = signal(true);
  cols = ['description', 'type', 'order', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getTypes().subscribe(t => this.types.set(t));
    this.svc.getAll().subscribe({
      next: d => { this.questions.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    this.dialog.open(QuestionDialogComponent, { data: { question: null, types: this.types() } })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(q: Question) {
    this.dialog.open(QuestionDialogComponent, { data: { question: q, types: this.types() } })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(q: Question) {
    if (!confirm(`Delete "${q.questionDescription}"?`)) return;
    this.svc.delete(q.questionId).subscribe({
      next: () => { this.snack.open('Question deleted.', '', { duration: 2500 }); this.load(); },
      error: e => this.snack.open(typeof e.error === 'string' ? e.error : 'Cannot delete.', 'Close', { duration: 4000 })
    });
  }
}
