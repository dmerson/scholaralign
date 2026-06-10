import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserApplicationService } from './user-application.service';

const EMAIL = 'student@test.edu';
const ENCODED = encodeURIComponent(EMAIL);
const SCHOL_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const AQ_ID    = 'bbbbbbbb-0000-0000-0000-000000000002';

describe('UserApplicationService', () => {
  let service: UserApplicationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), UserApplicationService]
    });
    service = TestBed.inject(UserApplicationService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getMyApplications() GETs /api/user-applications/{encodedEmail}', () => {
    service.getMyApplications(EMAIL).subscribe(r => expect(r).toEqual([]));
    const req = http.expectOne(`/api/user-applications/${ENCODED}`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getDetail() GETs /api/user-applications/{encodedEmail}/{scholarshipId}', () => {
    service.getDetail(EMAIL, SCHOL_ID).subscribe();
    const req = http.expectOne(`/api/user-applications/${ENCODED}/${SCHOL_ID}`);
    expect(req.request.method).toBe('GET');
    req.flush({ scholarshipId: SCHOL_ID, scholarshipName: 'S', applicationId: '', applicationName: '', isSubmitted: false, questions: [] });
  });

  it('saveAnswer() POSTs to /api/user-applications/answer with correct body', () => {
    service.saveAnswer(EMAIL, SCHOL_ID, AQ_ID, '3.8').subscribe(r => expect(r.saved).toBe(true));
    const req = http.expectOne('/api/user-applications/answer');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      userEmail: EMAIL,
      scholarshipId: SCHOL_ID,
      applicationQuestionId: AQ_ID,
      answerValue: '3.8'
    });
    req.flush({ saved: true });
  });

  it('submit() POSTs to /api/user-applications/submit with correct body', () => {
    service.submit(EMAIL, SCHOL_ID).subscribe(r => expect(r.submitted).toBe(true));
    const req = http.expectOne('/api/user-applications/submit');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userEmail: EMAIL, scholarshipId: SCHOL_ID });
    req.flush({ submitted: true, submittedDate: '2026-01-01T00:00:00Z' });
  });
});
