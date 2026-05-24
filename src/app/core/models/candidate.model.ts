import { CandidateStatus } from './candidate-status.enum';

export interface Candidate {
  id: number;
  application_no: string;
  name: string;
  status: CandidateStatus;
  remarks?: string;
  verifier_status?: string | null;
  verifier_remarks?: string | null;
}

