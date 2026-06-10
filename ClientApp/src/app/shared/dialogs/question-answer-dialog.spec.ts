import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { QuestionAnswerDialogComponent, QuestionAnswerDialogData } from './question-answer-dialog';
import { EngineService } from '../../core/services/engine.service';
import { Question } from '../../core/models/question.model';

const now = '2026-01-01T00:00:00Z';

function makeQuestion(typeId: number, attrs?: string): Question {
  return {
    questionId: 'q-001', questionDescription: 'Test question', questionTypeId: typeId,
    questionTypeAttributes: attrs ?? null, createdBy: '', createdOn: now, updatedBy: '', lastModified: now
  };
}

describe('QuestionAnswerDialogComponent', () => {
  let fixture: ComponentFixture<QuestionAnswerDialogComponent>;
  let component: QuestionAnswerDialogComponent;
  let engineSvcMock: { saveAnswer: ReturnType<typeof vi.fn> };
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(question: Question, currentAnswer: string | null = null) {
    engineSvcMock = { saveAnswer: vi.fn().mockReturnValue(of({ saved: true })) };
    dialogRefMock = { close: vi.fn() };

    const data: QuestionAnswerDialogData = { question, currentAnswer, userEmail: 'student@test.edu' };

    TestBed.configureTestingModule({
      imports: [QuestionAnswerDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: EngineService,    useValue: engineSvcMock },
        { provide: MatDialogRef,     useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA,  useValue: data }
      ]
    });

    fixture   = TestBed.createComponent(QuestionAnswerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  // ── canSubmit ──────────────────────────────────────────────────────────

  it('canSubmit is false when text answer is empty (type 1)', () => {
    createComponent(makeQuestion(1));
    component.answerText.set('');
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is true when text answer has content (type 1)', () => {
    createComponent(makeQuestion(1));
    component.answerText.set('Computer Science');
    expect(component.canSubmit()).toBe(true);
  });

  it('canSubmit is false when text is only whitespace', () => {
    createComponent(makeQuestion(1));
    component.answerText.set('   ');
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is false for type 4 (multi-select) when nothing selected', () => {
    createComponent(makeQuestion(4, '["A","B","C"]'));
    component.answerMulti.set([]);
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is true for type 4 when at least one item selected', () => {
    createComponent(makeQuestion(4, '["A","B","C"]'));
    component.answerMulti.set(['A']);
    expect(component.canSubmit()).toBe(true);
  });

  // ── setAnswerText coercion ─────────────────────────────────────────────

  it('setAnswerText coerces a number to string', () => {
    createComponent(makeQuestion(3));
    component.setAnswerText(3.8);
    expect(component.answerText()).toBe('3.8');
  });

  it('setAnswerText coerces null to empty string', () => {
    createComponent(makeQuestion(1));
    component.setAnswerText(null);
    expect(component.answerText()).toBe('');
  });

  it('setAnswerText keeps string unchanged', () => {
    createComponent(makeQuestion(1));
    component.setAnswerText('hello');
    expect(component.answerText()).toBe('hello');
  });

  // ── Pre-fill from currentAnswer ─────────────────────────────────────────

  it('pre-fills answerText from currentAnswer for text questions', () => {
    createComponent(makeQuestion(1), 'Pre-filled value');
    expect(component.answerText()).toBe('Pre-filled value');
  });

  it('pre-fills answerMulti from JSON array for type 4', () => {
    createComponent(makeQuestion(4, '["A","B"]'), '["A","B"]');
    expect(component.answerMulti()).toEqual(['A', 'B']);
  });

  it('falls back to single-item array if JSON parse fails for type 4', () => {
    createComponent(makeQuestion(4), 'not json');
    expect(component.answerMulti()).toEqual(['not json']);
  });

  // ── listOptions ────────────────────────────────────────────────────────

  it('listOptions parses JSON array from questionTypeAttributes', () => {
    createComponent(makeQuestion(5, '["Freshman","Sophomore","Junior"]'));
    expect(component.listOptions()).toEqual(['Freshman', 'Sophomore', 'Junior']);
  });

  it('listOptions returns [] when attributes is null', () => {
    createComponent(makeQuestion(1, undefined));
    expect(component.listOptions()).toEqual([]);
  });

  it('listOptions returns [] on invalid JSON', () => {
    createComponent(makeQuestion(5, 'not-json'));
    expect(component.listOptions()).toEqual([]);
  });

  // ── save() ─────────────────────────────────────────────────────────────

  it('save() calls engineSvc.saveAnswer with trimmed text value', () => {
    createComponent(makeQuestion(1));
    component.answerText.set('  Computer Science  ');
    component.save();
    expect(engineSvcMock.saveAnswer).toHaveBeenCalledWith(
      'student@test.edu', 'q-001', 'Computer Science'
    );
  });

  it('save() JSON-stringifies multi answers for type 4', () => {
    createComponent(makeQuestion(4, '["A","B"]'));
    component.answerMulti.set(['A', 'B']);
    component.save();
    expect(engineSvcMock.saveAnswer).toHaveBeenCalledWith(
      'student@test.edu', 'q-001', '["A","B"]'
    );
  });

  it('save() closes dialog with true on success', () => {
    createComponent(makeQuestion(1));
    component.answerText.set('CS');
    component.save();
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('save() does not close dialog on error, clears saving flag', () => {
    createComponent(makeQuestion(1));
    engineSvcMock.saveAnswer.mockReturnValue(throwError(() => new Error('API error')));
    component.answerText.set('CS');
    component.save();
    expect(dialogRefMock.close).not.toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });

  it('save() is a no-op when canSubmit is false', () => {
    createComponent(makeQuestion(1));
    component.answerText.set('');
    component.save();
    expect(engineSvcMock.saveAnswer).not.toHaveBeenCalled();
  });
});
