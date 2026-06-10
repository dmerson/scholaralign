import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { EngineService } from '../../core/services/engine.service';
import { ScholarshipDetailInfo, RequirementDetail } from '../../core/models/dashboard.model';
import { Question } from '../../core/models/question.model';
import { QuestionAnswerDialogComponent } from '../../shared/dialogs/question-answer-dialog';

const OPERATOR_LABELS: Record<number, string> = {
  1: '=', 2: '>', 3: '<', 4: '≠', 5: '≥', 6: '≤', 7: 'In', 8: 'Not in'
};

const STATUS_MAP = {
  pass:    { icon: 'check_circle',  cls: 'icon-pass',    tip: 'You meet this requirement'      },
  fail:    { icon: 'cancel',        cls: 'icon-fail',    tip: 'You do not meet this requirement' },
  unknown: { icon: 'help',          cls: 'icon-unknown', tip: 'Answer needed to evaluate'       },
};

@Component({
  selector: 'app-scholarship-detail',
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressSpinnerModule, MatTooltipModule, MatDialogModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <a mat-button routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon> Dashboard
        </a>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="48" /></div>
      } @else if (!info()) {
        <mat-card><mat-card-content><p class="empty">Scholarship not found.</p></mat-card-content></mat-card>
      } @else {
        <!-- ── Info card ─────────────────────────────────────────── -->
        <mat-card class="info-card" [class]="statusClass()">
          <mat-card-header>
            <mat-icon mat-card-avatar [class]="statusIconClass()">school</mat-icon>
            <mat-card-title>{{ info()!.scholarshipName }}</mat-card-title>
            <mat-card-subtitle>{{ info()!.orgName }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="meta-row">
              @if (info()!.amount || info()!.amountDescription) {
                <span class="chip"><mat-icon inline>attach_money</mat-icon>
                  {{ info()!.amountDescription || ('$' + info()!.amount) }}</span>
              }
              @if (info()!.startDate && info()!.endDate) {
                <span class="chip"><mat-icon inline>event</mat-icon>
                  {{ info()!.startDate!.slice(0,10) }} – {{ info()!.endDate!.slice(0,10) }}</span>
              }
              @if (info()!.awardYearDescription) {
                <span class="chip"><mat-icon inline>calendar_today</mat-icon>
                  {{ info()!.awardYearDescription }}</span>
              }
              <span class="chip status-chip" [class]="statusChipClass()">
                <mat-icon inline>{{ statusIcon() }}</mat-icon> {{ statusLabel() }}
              </span>
            </div>

            @if (info()!.scholarshipDescription) {
              <p class="description">{{ info()!.scholarshipDescription }}</p>
            }
            @if (info()!.eligibilityInformation) {
              <div class="section">
                <span class="section-label">Eligibility</span>
                <p>{{ info()!.eligibilityInformation }}</p>
              </div>
            }
            @if (info()!.awardingInformation) {
              <div class="section">
                <span class="section-label">Awarding Information</span>
                <p>{{ info()!.awardingInformation }}</p>
              </div>
            }
            @if (info()!.scholarshipUrl) {
              <a [href]="info()!.scholarshipUrl" target="_blank" rel="noopener" class="ext-link">
                <mat-icon inline>open_in_new</mat-icon> Scholarship Website
              </a>
            }
          </mat-card-content>
        </mat-card>

        <!-- ── Requirements grid ─────────────────────────────────── -->
        @if (requirements().length > 0) {
          <mat-card class="req-card">
            <mat-card-header>
              <mat-card-title>Eligibility Requirements</mat-card-title>
              <mat-card-subtitle>{{ passCount() }} of {{ requirements().length }} requirements met</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="requirements()" class="full-width">
                <ng-container matColumnDef="group">
                  <th mat-header-cell *matHeaderCellDef class="col-grp">Grp</th>
                  <td mat-cell *matCellDef="let r" class="col-grp">{{ r.grouping }}</td>
                </ng-container>
                <ng-container matColumnDef="question">
                  <th mat-header-cell *matHeaderCellDef>Requirement</th>
                  <td mat-cell *matCellDef="let r">{{ r.questionDescription }}</td>
                </ng-container>
                <ng-container matColumnDef="operator">
                  <th mat-header-cell *matHeaderCellDef class="col-op">Op</th>
                  <td mat-cell *matCellDef="let r" class="col-op mono">
                    {{ operatorLabel(r.operatorId) }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="value">
                  <th mat-header-cell *matHeaderCellDef>Required Value</th>
                  <td mat-cell *matCellDef="let r" class="mono">{{ formatValue(r.requirementValue) }}</td>
                </ng-container>
                <ng-container matColumnDef="answer">
                  <th mat-header-cell *matHeaderCellDef>Your Answer</th>
                  <td mat-cell *matCellDef="let r">
                    @if (r.userAnswer) {
                      <span class="answer-val">{{ formatValue(r.userAnswer) }}</span>
                    } @else {
                      <span class="no-answer">—</span>
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef class="col-status">Status</th>
                  <td mat-cell *matCellDef="let r" class="col-status">
                    @if (r.status === 1) {
                      <mat-icon class="icon-pass" [matTooltip]="STATUS_MAP.pass.tip">check_circle</mat-icon>
                    } @else if (r.status === -1) {
                      <mat-icon class="icon-fail" [matTooltip]="STATUS_MAP.fail.tip">cancel</mat-icon>
                    } @else {
                      <mat-icon class="icon-unknown" [matTooltip]="STATUS_MAP.unknown.tip">help</mat-icon>
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="edit">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let r">
                    <button mat-icon-button title="Answer / update" (click)="openAnswer(r)">
                      <mat-icon>edit</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="cols"></tr>
                <tr mat-row *matRowDef="let row; columns: cols;"
                    [class.row-pass]="row.status === 1"
                    [class.row-fail]="row.status === -1"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card class="req-card">
            <mat-card-content>
              <p class="empty">No specific requirements are defined — eligibility is based on availability only.</p>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 960px; }
    .page-header { margin-bottom: 16px; }
    .center { display: flex; justify-content: center; padding: 64px; }
    .empty { color: #888; font-style: italic; }

    .info-card { margin-bottom: 24px; border-left: 4px solid #9e9e9e; }
    .info-card.status-eligible   { border-left-color: #388e3c; }
    .info-card.status-unknown    { border-left-color: #f57c00; }
    .info-card.status-ineligible { border-left-color: #e53935; }

    .meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .chip { display: inline-flex; align-items: center; gap: 4px; background: #f5f5f5;
            border-radius: 14px; padding: 4px 10px; font-size: 0.85rem; color: #444; }
    .status-chip.eligible   { background: #e8f5e9; color: #388e3c; }
    .status-chip.unknown    { background: #fff3e0; color: #f57c00; }
    .status-chip.ineligible { background: #ffebee; color: #e53935; }

    .description { margin: 8px 0 12px; color: #444; }
    .section { margin: 12px 0; }
    .section-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
                     letter-spacing: .05em; color: #888; display: block; margin-bottom: 4px; }
    .section p { margin: 0; color: #444; }
    .ext-link { display: inline-flex; align-items: center; gap: 4px; font-size: 0.9rem; margin-top: 8px; }

    .req-card { margin-bottom: 24px; }
    .full-width { width: 100%; }
    .col-grp    { width: 48px; text-align: center; }
    .col-op     { width: 48px; text-align: center; }
    .col-status { width: 64px; text-align: center; }
    .mono { font-family: monospace; font-size: 0.9rem; }
    .answer-val { font-weight: 500; }
    .no-answer  { color: #bbb; }
    .row-pass { background: #f1f8f1; }
    .row-fail { background: #fff5f5; }

    .icon-pass    { color: #388e3c; vertical-align: middle; }
    .icon-fail    { color: #e53935; vertical-align: middle; }
    .icon-unknown { color: #f57c00; vertical-align: middle; }

    mat-icon[mat-card-avatar] { font-size: 32px; height: 32px; width: 32px; }
    .eligible-avatar   { color: #388e3c; }
    .unknown-avatar    { color: #f57c00; }
    .ineligible-avatar { color: #e53935; }
  `]
})
export class ScholarshipDetailComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  private authSvc    = inject(AuthService);
  private engineSvc  = inject(EngineService);
  private dialog     = inject(MatDialog);

  protected readonly STATUS_MAP = STATUS_MAP;

  loading      = signal(true);
  info         = signal<ScholarshipDetailInfo | null>(null);
  userStatus   = signal<number | null>(null);
  requirements = signal<RequirementDetail[]>([]);
  cols = ['group', 'question', 'operator', 'value', 'answer', 'status', 'edit'];

  passCount() { return this.requirements().filter(r => r.status === 1).length; }

  statusLabel() {
    const s = this.userStatus();
    if (s === 1) return 'Eligible';
    if (s === -1) return 'Ineligible';
    return 'Pending';
  }
  statusIcon() {
    const s = this.userStatus();
    if (s === 1) return 'check_circle';
    if (s === -1) return 'cancel';
    return 'help';
  }
  statusClass() {
    const s = this.userStatus();
    if (s === 1) return 'status-eligible';
    if (s === -1) return 'status-ineligible';
    return 'status-unknown';
  }
  statusChipClass() {
    const s = this.userStatus();
    if (s === 1) return 'eligible';
    if (s === -1) return 'ineligible';
    return 'unknown';
  }
  statusIconClass() {
    const s = this.userStatus();
    if (s === 1) return 'eligible-avatar';
    if (s === -1) return 'ineligible-avatar';
    return 'unknown-avatar';
  }

  operatorLabel(id: number) { return OPERATOR_LABELS[id] ?? '?'; }

  formatValue(v: string | null | undefined): string {
    if (!v) return '—';
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p.join(', ');
    } catch { /* raw value */ }
    return v;
  }

  ngOnInit() {
    const id    = this.route.snapshot.paramMap.get('id') ?? '';
    const email = this.authSvc.user()?.email;
    if (!email || !id) { this.loading.set(false); return; }

    this.engineSvc.getScholarshipDetail(email, id).subscribe({
      next: resp => {
        this.info.set(resp.scholarship);
        this.userStatus.set(resp.userStatus);
        this.requirements.set(resp.requirements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAnswer(req: RequirementDetail) {
    const email = this.authSvc.user()?.email;
    if (!email) return;
    const question: Question = {
      questionId: req.questionId,
      questionDescription: req.questionDescription ?? req.questionId,
      questionTypeId: req.questionTypeId,
      questionTypeAttributes: req.questionTypeAttributes,
      createdBy: '', createdOn: '', updatedBy: '', lastModified: ''
    };
    this.dialog.open(QuestionAnswerDialogComponent, {
      data: { question, currentAnswer: req.userAnswer ?? null, userEmail: email }
    }).afterClosed().subscribe(saved => {
      if (!saved) return;
      const id = this.route.snapshot.paramMap.get('id') ?? '';
      this.loading.set(true);
      this.engineSvc.getScholarshipDetail(email, id).subscribe({
        next: resp => {
          this.info.set(resp.scholarship);
          this.userStatus.set(resp.userStatus);
          this.requirements.set(resp.requirements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    });
  }
}
