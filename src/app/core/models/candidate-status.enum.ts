export enum CandidateStatus {
  VERIFIED = 'VERIFIED',
  ON_HOLD = 'ON_HOLD',
  REJECTED = 'REJECTED',
  PENDING = 'PENDING'
}

export const CandidateStatusLabel: Record<CandidateStatus, string> = {
    [CandidateStatus.VERIFIED]: 'Verified',
    [CandidateStatus.ON_HOLD]: 'On Hold',
    [CandidateStatus.REJECTED]: 'Rejected',
    [CandidateStatus.PENDING]: 'Pending'
};