import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../config/environment';
import { Observable } from 'rxjs';

export interface InterviewMember {
  member_type: string;
  name: string;
  designation: string;
  lab_estt: string;
}

export interface InterviewCommittee {
  id?: number;
  cycle: string;
  post_name: string;
  members: InterviewMember[];
}

export interface ShortlistedCandidate {
  application_no: string;
  candidate_name: string | null;
  father_name: string | null;
  category: string | null;
}


@Injectable({ providedIn: 'root' })
export class InterviewService {
  private baseUrl = env.apiUrl;

  constructor(private http: HttpClient) {}

  saveInterviewCommittee(data: InterviewCommittee): Observable<InterviewCommittee> {
    return this.http.post<InterviewCommittee>(`${this.baseUrl}/interview/committee`, data);
  }

  getInterviewCommittee(cycle: string, postName: string): Observable<InterviewCommittee> {
    return this.http.get<InterviewCommittee>(
      `${this.baseUrl}/interview/committee?cycle=${encodeURIComponent(cycle)}&post_name=${encodeURIComponent(postName)}`
    );
  }

  getInterviewCommittees(cycle?: string, postName?: string): Observable<InterviewCommittee[]> {
    let url = `${this.baseUrl}/interview/committees`;
    const params: string[] = [];
    if (cycle) params.push(`cycle=${encodeURIComponent(cycle)}`);
    if (postName) params.push(`post_name=${encodeURIComponent(postName)}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<InterviewCommittee[]>(url);
  }

  deleteInterviewCommittee(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/interview/committee/${id}`);
  }

  getShortlistedCandidates(cycle: string, postName: string): Observable<ShortlistedCandidate[]> {
    return this.http.get<ShortlistedCandidate[]>(
      `${this.baseUrl}/interview/shortlisted-candidates?cycle=${encodeURIComponent(cycle)}&post_name=${encodeURIComponent(postName)}`
    );
  }
}

