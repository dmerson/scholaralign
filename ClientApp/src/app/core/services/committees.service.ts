import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ScholarshipWithCommittees } from '../models/committee.model';

@Injectable({ providedIn: 'root' })
export class CommitteesService {
  private http = inject(HttpClient);
  private base = '/api/committees';

  getByOrg(organizationId: string) {
    return this.http.get<ScholarshipWithCommittees[]>(`${this.base}?organizationId=${organizationId}`);
  }

  assign(scholarshipId: string, subOrganizationId: string) {
    return this.http.post<{ scholarshipCommitteeId: string }>(this.base, { scholarshipId, subOrganizationId });
  }

  unassign(scholarshipCommitteeId: string) {
    return this.http.delete(`${this.base}/${scholarshipCommitteeId}`);
  }
}
