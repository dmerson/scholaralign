import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminApplicationService } from '../../core/services/admin-application.service';
import { QuestionService } from '../../core/services/question.service';
import { AdminApplication, ApplicationQuestionRow } from '../../core/models/admin-application.model';
import { Question } from '../../core/models/question.model';
import { AddAppQuestionDialogComponent } from '../../shared/dialogs/add-app-question-dialog';

@Component({
  selector: 'app-application-questions',
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
            MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div class="page">
      <div class="page-header">
        <a mat-button [routerLink]="backUrl()">
          <mat-icon>arrow_back</mat-icon> Applications
        </a>
        <h2>{{ app()?.scholarshipApplicationName ?? 'Application Questions' }}</h2>
        <button mat-raised-button color="primary" (click)="openAdd()">
          <mat-icon>add</mat-icon> Add Question
        </button>
      </div>
      <p class="hint">
        Questions appear to applicants in the order shown. Use the arrows to reorder.
        @if (app()) {
          Org: <strong>{{ app()!.orgName }}</strong>
          @if (app()!.subOrgName) { &nbsp;/&nbsp;<strong>{{ app()!.subOrgName }}</strong> }
        }
      </p>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="sorted()" class="full-width">
            <ng-container matColumnDef="order">
              <th mat-header-cell *matHeaderCellDef class="col-ord">#</th>
              <td mat-cell *matCellDef="let row" class="col-ord muted">{{ row.order }}</td>
            </ng-container>
            <ng-container matColumnDef="question">
              <th mat-header-cell *matHeaderCellDef>Question</th>
              <td mat-cell *matCellDef="let row">{{ row.questionDescription }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef class="col-type">Type</th>
              <td mat-cell *matCellDef="let row" class="col-type muted">{{ row.questionTypeDescription }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="col-act"></th>
              <td mat-cell *matCellDef="let row; let i = index" class="col-act">
                <button mat-icon-button matTooltip="Move up" [disabled]="i === 0" (click)="moveUp(row)">
                  <mat-icon>arrow_upward</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Move down" [disabled]="i === sorted().length - 1" (click)="moveDown(row)">
                  <mat-icon>arrow_downward</mat-icon>
                </button>
                <button mat-icon-button color="warn" matTooltip="Remove" (click)="remove(row)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            <tr *matNoDataRow>
              <td [attr.colspan]="cols.length" class="no-data">No questions added yet. Click Add Question to get started.</td>
            </tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 900px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
    .page-header h2 { flex: 1; margin: 0; }
    .hint { color: #666; font-size: 0.9rem; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .col-ord  { width: 56px; text-align: center; }
    .col-type { width: 140px; }
    .col-act  { width: 144px; text-align: right; white-space: nowrap; }
    .muted { color: #888; }
    .no-data { padding: 24px; text-align: center; color: #666; }
    .center { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class ApplicationQuestionsComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private svc    = inject(AdminApplicationService);
  private qSvc   = inject(QuestionService);
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);

  appId     = '';
  app       = signal<AdminApplication | null>(null);
  questions = signal<ApplicationQuestionRow[]>([]);
  allQuestions = signal<Question[]>([]);
  loading   = signal(true);
  cols      = ['order', 'question', 'type', 'actions'];

  sorted = computed(() => [...this.questions()].sort((a, b) => a.order - b.order));

  backUrl = computed(() =>
    this.router.url.includes('/org-admin/') ? '/org-admin/applications' : '/public-admin/applications'
  );

  ngOnInit() {
    this.appId = this.route.snapshot.paramMap.get('id') ?? '';
    this.svc.getById(this.appId).subscribe(a => this.app.set(a));
    this.qSvc.getAll().subscribe(q => this.allQuestions.set(q));
    this.loadQuestions();
  }

  loadQuestions() {
    this.loading.set(true);
    this.svc.getQuestions(this.appId).subscribe({
      next: d => { this.questions.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    const usedIds = new Set(this.questions().map(q => q.questionId));
    const available = this.allQuestions().filter(q => !usedIds.has(q.questionId));
    const maxOrder = this.questions().reduce((m, q) => Math.max(m, q.order), 0);
    this.dialog.open(AddAppQuestionDialogComponent, {
      data: { applicationId: this.appId, availableQuestions: available, nextOrder: maxOrder + 10 }
    }).afterClosed().subscribe(r => { if (r) this.loadQuestions(); });
  }

  moveUp(row: ApplicationQuestionRow) {
    const list = this.sorted();
    const idx  = list.findIndex(r => r.applicationQuestionId === row.applicationQuestionId);
    if (idx <= 0) return;
    const prev = list[idx - 1];
    this.svc.updateQuestionOrder(this.appId, row.applicationQuestionId, prev.order).pipe(
      switchMap(() => this.svc.updateQuestionOrder(this.appId, prev.applicationQuestionId, row.order))
    ).subscribe(() => this.loadQuestions());
  }

  moveDown(row: ApplicationQuestionRow) {
    const list = this.sorted();
    const idx  = list.findIndex(r => r.applicationQuestionId === row.applicationQuestionId);
    if (idx >= list.length - 1) return;
    const next = list[idx + 1];
    this.svc.updateQuestionOrder(this.appId, row.applicationQuestionId, next.order).pipe(
      switchMap(() => this.svc.updateQuestionOrder(this.appId, next.applicationQuestionId, row.order))
    ).subscribe(() => this.loadQuestions());
  }

  remove(row: ApplicationQuestionRow) {
    if (!confirm(`Remove "${row.questionDescription}" from this application?`)) return;
    this.svc.removeQuestion(this.appId, row.applicationQuestionId).subscribe({
      next: () => { this.snack.open('Question removed.', '', { duration: 2500 }); this.loadQuestions(); },
      error: () => this.snack.open('Cannot remove.', 'Close', { duration: 4000 })
    });
  }
}
