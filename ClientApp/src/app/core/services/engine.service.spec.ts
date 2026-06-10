import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EngineService } from './engine.service';

const EMAIL = 'student@test.edu';
const ENCODED_EMAIL = encodeURIComponent(EMAIL);
const Q_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

describe('EngineService', () => {
  let service: EngineService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EngineService]
    });
    service = TestBed.inject(EngineService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sync() POSTs to /api/engine/sync with userEmail body', () => {
    service.sync(EMAIL).subscribe(r => expect(r.synced).toBe(true));
    const req = http.expectOne('/api/engine/sync');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userEmail: EMAIL });
    req.flush({ synced: true });
  });

  it('getDashboard() GETs from /api/engine/dashboard/{encodedEmail}', () => {
    const payload = { eligible: [], unknown: [], ineligible: [] };
    service.getDashboard(EMAIL).subscribe(d => expect(d).toEqual(payload));
    const req = http.expectOne(`/api/engine/dashboard/${ENCODED_EMAIL}`);
    expect(req.request.method).toBe('GET');
    req.flush(payload);
  });

  it('getNextQuestion() GETs from /api/engine/next-question/{encodedEmail}', () => {
    service.getNextQuestion(EMAIL).subscribe(q => expect(q).toBeNull());
    const req = http.expectOne(`/api/engine/next-question/${ENCODED_EMAIL}`);
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('getNextQuestion() returns Question when one exists', () => {
    const question = {
      questionId: Q_ID, questionDescription: 'What is your GPA?',
      questionTypeId: 3, createdBy: '', createdOn: '', updatedBy: '', lastModified: ''
    };
    service.getNextQuestion(EMAIL).subscribe(q => expect(q).toEqual(question));
    http.expectOne(`/api/engine/next-question/${ENCODED_EMAIL}`).flush(question);
  });

  it('saveAnswer() POSTs to /api/engine/answer with correct body', () => {
    service.saveAnswer(EMAIL, Q_ID, '3.8').subscribe(r => expect(r.saved).toBe(true));
    const req = http.expectOne('/api/engine/answer');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userEmail: EMAIL, questionId: Q_ID, answerValue: '3.8' });
    req.flush({ saved: true });
  });

  it('getMyAnswers() GETs from /api/engine/my-answers/{encodedEmail}', () => {
    service.getMyAnswers(EMAIL).subscribe(answers => expect(answers).toHaveLength(0));
    const req = http.expectOne(`/api/engine/my-answers/${ENCODED_EMAIL}`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getScholarshipDetail() GETs with both encoded email and scholarshipId', () => {
    const SCHOL_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
    service.getScholarshipDetail(EMAIL, SCHOL_ID).subscribe();
    const req = http.expectOne(`/api/engine/scholarship-detail/${ENCODED_EMAIL}/${SCHOL_ID}`);
    expect(req.request.method).toBe('GET');
    req.flush({ scholarship: {}, userStatus: null, requirements: [] });
  });
});
