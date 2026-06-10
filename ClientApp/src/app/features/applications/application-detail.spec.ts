import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApplicationDetailComponent } from './application-detail';
import { AuthService } from '../../core/services/auth.service';
import { UserApplicationService } from '../../core/services/user-application.service';
import { UserApplicationDetail } from '../../core/models/dashboard.model';

const EMAIL = 'student@test.edu';
const SCHOL_ID = 'aaaa-0000-0000-0000-000000000001';
const AQ1 = 'aqaq-0001-0000-0000-000000000001';
const AQ2 = 'aqaq-0002-0000-0000-000000000002';

function makeDetail(overrides: Partial<UserApplicationDetail> = {}): UserApplicationDetail {
  return {
    scholarshipId: SCHOL_ID,
    scholarshipName: 'Merit Award',
    applicationId: 'app-001',
    applicationName: 'App Form',
    isSubmitted: false,
    submittedDate: null,
    questions: [
      { applicationQuestionId: AQ1, questionId: 'q1', questionDescription: 'Your GPA?',
        questionTypeId: 3, order: 10, answerValue: null },
      { applicationQuestionId: AQ2, questionId: 'q2', questionDescription: 'Your major?',
        questionTypeId: 1, order: 20, answerValue: null }
    ],
    ...overrides
  };
}

describe('ApplicationDetailComponent', () => {
  let fixture: ComponentFixture<ApplicationDetailComponent>;
  let component: ApplicationDetailComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userAppMock: any;

  function setup(detail: UserApplicationDetail = makeDetail()) {
    userAppMock = {
      getDetail:  vi.fn().mockReturnValue(of(detail)),
      saveAnswer: vi.fn().mockReturnValue(of({ saved: true })),
      submit:     vi.fn().mockReturnValue(of({ submitted: true, submittedDate: '2026-01-01' }))
    };
    const authMock  = { user: signal({ email: EMAIL }) };
    const routeMock = { snapshot: { paramMap: { get: () => SCHOL_ID } } };

    TestBed.configureTestingModule({
      imports:   [ApplicationDetailComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AuthService,           useValue: authMock },
        { provide: UserApplicationService, useValue: userAppMock },
        { provide: ActivatedRoute,         useValue: routeMock }
      ]
    });

    fixture   = TestBed.createComponent(ApplicationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  // ── Loading and initialisation ────────────────────────────────────────

  it('calls getDetail on init with correct email and scholarshipId', () => {
    setup();
    expect(userAppMock.getDetail).toHaveBeenCalledWith(EMAIL, SCHOL_ID);
  });

  it('loading becomes false after detail loads', () => {
    setup();
    expect(component.loading()).toBe(false);
  });

  it('detail signal is populated after load', () => {
    const d = makeDetail();
    setup(d);
    expect(component.detail()).toEqual(d);
  });

  // ── initAnswers pre-filling ───────────────────────────────────────────

  it('pre-fills textAnswers from existing answerValue', () => {
    const d = makeDetail();
    d.questions[0].answerValue = '3.8';
    d.questions[1].answerValue = 'Computer Science';
    setup(d);
    expect(component.textAnswers()[AQ1]).toBe('3.8');
    expect(component.textAnswers()[AQ2]).toBe('Computer Science');
  });

  it('pre-fills multiAnswers from JSON answerValue for type 4', () => {
    const d = makeDetail();
    d.questions[0] = { ...d.questions[0], questionTypeId: 4, answerValue: '["Freshman","Sophomore"]' };
    setup(d);
    expect(component.multiAnswers()[AQ1]).toEqual(['Freshman', 'Sophomore']);
  });

  it('multiAnswer defaults to empty array when JSON is invalid', () => {
    const d = makeDetail();
    d.questions[0] = { ...d.questions[0], questionTypeId: 4, answerValue: 'not-json' };
    setup(d);
    expect(component.multiAnswers()[AQ1]).toEqual([]);
  });

  it('textAnswer defaults to empty string when answerValue is null', () => {
    setup(makeDetail()); // questions have answerValue: null
    expect(component.textAnswers()[AQ1]).toBe('');
    expect(component.textAnswers()[AQ2]).toBe('');
  });

  // ── setTextAnswer coercion ────────────────────────────────────────────

  it('setTextAnswer coerces a number to string', () => {
    setup();
    component.setTextAnswer(AQ1, 3.8);
    expect(component.textAnswers()[AQ1]).toBe('3.8');
  });

  it('setTextAnswer coerces null to empty string', () => {
    setup();
    component.setTextAnswer(AQ1, null);
    expect(component.textAnswers()[AQ1]).toBe('');
  });

  // ── setMultiAnswer ────────────────────────────────────────────────────

  it('setMultiAnswer updates multiAnswers signal', () => {
    setup();
    component.setMultiAnswer(AQ1, ['A', 'B']);
    expect(component.multiAnswers()[AQ1]).toEqual(['A', 'B']);
  });

  // ── listOptions ────────────────────────────────────────────────────────

  it('listOptions parses JSON from questionTypeAttributes', () => {
    const d = makeDetail();
    d.questions[0] = { ...d.questions[0], questionTypeAttributes: '["A","B","C"]' };
    setup(d);
    const q = component.detail()!.questions[0];
    expect(component.listOptions(q)).toEqual(['A', 'B', 'C']);
  });

  it('listOptions returns [] when questionTypeAttributes is null', () => {
    setup();
    const q = component.detail()!.questions[0]; // no attributes
    expect(component.listOptions(q)).toEqual([]);
  });

  // ── saveDraft ─────────────────────────────────────────────────────────

  it('saveDraft skips questions with empty answers and does not call saveAnswer', () => {
    setup(); // all answers are empty
    component.saveDraft();
    expect(userAppMock.saveAnswer).not.toHaveBeenCalled();
  });

  it('saveDraft calls saveAnswer for each non-empty answer', () => {
    setup();
    component.setTextAnswer(AQ1, '3.8');
    component.setTextAnswer(AQ2, 'Biology');
    component.saveDraft();
    expect(userAppMock.saveAnswer).toHaveBeenCalledTimes(2);
    expect(userAppMock.saveAnswer).toHaveBeenCalledWith(EMAIL, SCHOL_ID, AQ1, '3.8');
    expect(userAppMock.saveAnswer).toHaveBeenCalledWith(EMAIL, SCHOL_ID, AQ2, 'Biology');
  });

  it('saveDraft sets saving to false after successful save', () => {
    setup();
    component.setTextAnswer(AQ1, '3.8');
    component.saveDraft();
    expect(component.saving()).toBe(false);
  });

  it('saveDraft resets saving flag on error', () => {
    setup(); // use standard setup, then override saveAnswer on the shared mock object
    userAppMock.saveAnswer = vi.fn().mockReturnValue(throwError(() => new Error('fail')));
    component.setTextAnswer(AQ1, '3.8');
    component.saveDraft();
    expect(component.saving()).toBe(false);
  });
});
