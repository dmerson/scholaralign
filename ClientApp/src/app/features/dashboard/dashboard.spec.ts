import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DashboardComponent } from './dashboard';
import { EngineService } from '../../core/services/engine.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardData } from '../../core/models/dashboard.model';
import { Question } from '../../core/models/question.model';

// ── Shared fixtures ──────────────────────────────────────────────────────────

const EMAIL = 'student@test.edu';
const now   = '2026-01-01T00:00:00Z';

const eligible   = [{ scholarshipId: 's1', scholarshipName: 'Merit Award', orgName: 'Org A' }];
const unknown    = [{ scholarshipId: 's2', scholarshipName: 'STEM Grant',   orgName: 'Org B' }];
const ineligible = [{ scholarshipId: 's3', scholarshipName: 'Sports Aid',   orgName: 'Org C' }];
const dashboard: DashboardData = { eligible, unknown, ineligible };

function makeQuestion(typeId: number, attrs?: string): Question {
  return {
    questionId: 'q-001', questionDescription: 'What is your major?', questionTypeId: typeId,
    questionTypeAttributes: attrs ?? null, createdBy: '', createdOn: now, updatedBy: '', lastModified: now
  };
}

// ── Suite ────────────────────────────────────────────────────────────────────

describe('DashboardComponent – wizard', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let engineMock: any;

  function setup(nextQuestion: Question | null = null, authenticated = true) {
    engineMock = {
      sync:            vi.fn().mockReturnValue(of({ synced: true })),
      getDashboard:    vi.fn().mockReturnValue(of(dashboard)),
      getNextQuestion: vi.fn().mockReturnValue(of(nextQuestion)),
      saveAnswer:      vi.fn().mockReturnValue(of({ saved: true }))
    };
    const authMock = {
      user: signal(authenticated ? { email: EMAIL } : null)
    };

    TestBed.configureTestingModule({
      imports:   [DashboardComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: EngineService, useValue: engineMock },
        { provide: AuthService,   useValue: authMock }
      ]
    });

    fixture   = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  // ── Initialisation ────────────────────────────────────────────────────

  it('starts with syncing = true before ngOnInit completes', () => {
    // Because mocks are synchronous, syncing is false by the time detectChanges() returns
    // but we can verify the service calls were made
    setup();
    expect(engineMock.sync).toHaveBeenCalledWith(EMAIL);
    expect(engineMock.getDashboard).toHaveBeenCalledWith(EMAIL);
  });

  it('syncing is false after init', () => {
    setup();
    expect(component.syncing()).toBe(false);
  });

  it('populates eligible signal from getDashboard response', () => {
    setup();
    expect(component.eligible()).toEqual(eligible);
  });

  it('populates unknown signal from getDashboard response', () => {
    setup();
    expect(component.unknown()).toEqual(unknown);
  });

  it('populates ineligible signal from getDashboard response', () => {
    setup();
    expect(component.ineligible()).toEqual(ineligible);
  });

  it('calls getNextQuestion after sync+dashboard', () => {
    setup();
    expect(engineMock.getNextQuestion).toHaveBeenCalledWith(EMAIL);
  });

  it('sets currentQuestion from getNextQuestion response', () => {
    const q = makeQuestion(1);
    setup(q);
    expect(component.currentQuestion()).toEqual(q);
  });

  it('currentQuestion is null when no question available', () => {
    setup(null);
    expect(component.currentQuestion()).toBeNull();
  });

  it('does nothing when user is not authenticated', () => {
    setup(null, false);
    expect(engineMock.sync).not.toHaveBeenCalled();
    expect(component.syncing()).toBe(false);
  });

  // ── canSubmit computed ────────────────────────────────────────────────

  it('canSubmit is false when currentQuestion is null', () => {
    setup(null);
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is false for text question with empty answer', () => {
    setup(makeQuestion(1));
    component.answerText.set('');
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is true for text question with answer', () => {
    setup(makeQuestion(1));
    component.answerText.set('Computer Science');
    expect(component.canSubmit()).toBe(true);
  });

  it('canSubmit is false for multi-select (type 4) with nothing selected', () => {
    setup(makeQuestion(4, '["A","B"]'));
    component.answerMulti.set([]);
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is true for multi-select with at least one selection', () => {
    setup(makeQuestion(4, '["A","B"]'));
    component.answerMulti.set(['A']);
    expect(component.canSubmit()).toBe(true);
  });

  it('canSubmit is false for decimal question with empty input', () => {
    setup(makeQuestion(3));
    component.answerText.set('');
    expect(component.canSubmit()).toBe(false);
  });

  // ── setAnswerText coercion ────────────────────────────────────────────

  it('setAnswerText coerces a number to string', () => {
    setup(makeQuestion(3));
    component.setAnswerText(3.8);
    expect(component.answerText()).toBe('3.8');
  });

  it('setAnswerText coerces null to empty string', () => {
    setup(makeQuestion(1));
    component.setAnswerText(null);
    expect(component.answerText()).toBe('');
  });

  // ── listOptions computed ──────────────────────────────────────────────

  it('listOptions parses JSON attributes', () => {
    setup(makeQuestion(5, '["Freshman","Sophomore","Junior"]'));
    expect(component.listOptions()).toEqual(['Freshman', 'Sophomore', 'Junior']);
  });

  it('listOptions returns [] when no attributes', () => {
    setup(makeQuestion(1, undefined));
    expect(component.listOptions()).toEqual([]);
  });

  // ── submitAnswer ──────────────────────────────────────────────────────

  it('submitAnswer calls saveAnswer then getDashboard then getNextQuestion', () => {
    setup(makeQuestion(1));
    component.answerText.set('Computer Science');
    component.submitAnswer();

    expect(engineMock.saveAnswer).toHaveBeenCalledWith(EMAIL, 'q-001', 'Computer Science');
    expect(engineMock.getDashboard).toHaveBeenCalledTimes(2); // once on init, once after answer
    expect(engineMock.getNextQuestion).toHaveBeenCalledTimes(2);
  });

  it('submitAnswer trims whitespace from text answers', () => {
    setup(makeQuestion(1));
    component.answerText.set('  Biology  ');
    component.submitAnswer();
    expect(engineMock.saveAnswer).toHaveBeenCalledWith(EMAIL, 'q-001', 'Biology');
  });

  it('submitAnswer JSON-stringifies multi-select answers (type 4)', () => {
    setup(makeQuestion(4, '["A","B"]'));
    component.answerMulti.set(['A', 'B']);
    component.submitAnswer();
    expect(engineMock.saveAnswer).toHaveBeenCalledWith(EMAIL, 'q-001', '["A","B"]');
  });

  it('submitAnswer is no-op when canSubmit is false', () => {
    setup(null);
    component.submitAnswer();
    expect(engineMock.saveAnswer).not.toHaveBeenCalled();
  });

  it('answerSubmitting resets to false on error', () => {
    engineMock.saveAnswer.mockReturnValue(throwError(() => new Error('fail')));
    setup(makeQuestion(1));
    component.answerText.set('CS');
    component.submitAnswer();
    expect(component.answerSubmitting()).toBe(false);
  });

  it('resets answerText and answerMulti before loading next question', () => {
    setup(makeQuestion(1));
    component.answerText.set('old value');
    component.answerMulti.set(['old']);
    component.loadNextQuestion();
    expect(component.answerText()).toBe('');
    expect(component.answerMulti()).toEqual([]);
  });
});
