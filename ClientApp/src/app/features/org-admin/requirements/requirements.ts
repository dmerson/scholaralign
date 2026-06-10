import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RequirementService } from '../../../core/services/requirement.service';
import { QuestionService } from '../../../core/services/question.service';
import { Requirement, Operator } from '../../../core/models/requirement.model';
import { Question } from '../../../core/models/question.model';
import { RequirementDialogComponent } from '../../../shared/dialogs/requirement-dialog';

@Component({
  selector: 'app-requirements',
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <a mat-button routerLink="/org-admin/scholarships">
          <mat-icon>arrow_back</mat-icon> Scholarships
        </a>
        <h2>Scholarship Requirements</h2>
        <button mat-raised-button color="primary" (click)="openAdd()">
          <mat-icon>add</mat-icon> Add Requirement
        </button>
      </div>
      <p class="hint">Define eligibility rules. Requirements in the same group are AND'd together; any group being fully true makes the applicant eligible.</p>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="requirements()" class="full-width">
            <ng-container matColumnDef="group">
              <th mat-header-cell *matHeaderCellDef>Group</th>
              <td mat-cell *matCellDef="let row">{{ row.grouping }}</td>
            </ng-container>
            <ng-container matColumnDef="question">
              <th mat-header-cell *matHeaderCellDef>Question</th>
              <td mat-cell *matCellDef="let row">{{ row.questionDescription }}</td>
            </ng-container>
            <ng-container matColumnDef="operator">
              <th mat-header-cell *matHeaderCellDef>Operator</th>
              <td mat-cell *matCellDef="let row">{{ row.operatorShownName }}</td>
            </ng-container>
            <ng-container matColumnDef="value">
              <th mat-header-cell *matHeaderCellDef>Value</th>
              <td mat-cell *matCellDef="let row">{{ row.requirementValue }}</td>
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
              <td [attr.colspan]="cols.length" class="no-data">No requirements yet. Click Add Requirement to get started.</td>
            </tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
    .page-header h2 { flex: 1; margin: 0; }
    .hint { color: #666; margin-bottom: 24px; font-size: 0.9rem; }
    .full-width { width: 100%; }
    .no-data { padding: 24px; text-align: center; color: #666; }
    .center { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class RequirementsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(RequirementService);
  private qSvc = inject(QuestionService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  scholarshipId = '';
  requirements = signal<Requirement[]>([]);
  questions = signal<Question[]>([]);
  operators = signal<Operator[]>([]);
  loading = signal(true);
  cols = ['group', 'question', 'operator', 'value', 'actions'];

  ngOnInit() {
    this.scholarshipId = this.route.snapshot.paramMap.get('id') ?? '';
    this.svc.getOperators().subscribe(o => this.operators.set(o));
    this.qSvc.getAll().subscribe(q => this.questions.set(q));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.scholarshipId).subscribe({
      next: r => { this.requirements.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd() {
    this.dialog.open(RequirementDialogComponent, {
      data: { requirement: null, scholarshipId: this.scholarshipId, questions: this.questions(), operators: this.operators() }
    }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(r: Requirement) {
    this.dialog.open(RequirementDialogComponent, {
      data: { requirement: r, scholarshipId: this.scholarshipId, questions: this.questions(), operators: this.operators() }
    }).afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(r: Requirement) {
    if (!confirm('Delete this requirement?')) return;
    this.svc.delete(r.scholarshipRequirementId).subscribe({
      next: () => { this.snack.open('Requirement deleted.', '', { duration: 2500 }); this.load(); },
      error: () => this.snack.open('Cannot delete.', 'Close', { duration: 4000 })
    });
  }
}
