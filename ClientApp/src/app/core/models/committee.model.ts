export interface CommitteeAssignment {
  scholarshipCommitteeId: string;
  subOrganizationId: string;
  subOrganizationName: string;
}

export interface ScholarshipWithCommittees {
  scholarshipId: string;
  scholarshipName: string;
  committees: CommitteeAssignment[];
}
