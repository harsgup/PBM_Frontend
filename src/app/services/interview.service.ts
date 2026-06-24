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
}
