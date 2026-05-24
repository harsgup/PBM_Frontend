import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {env} from '../config/environment'
import { AssignJobResponse } from '../layout/assign-jobs/assign-jobs.component';

export interface BuildJobResponse {
  message: string;
  cycle: string;
  inserted: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  private baseUrl = env.apiUrl;

  constructor(private http: HttpClient) { }

getCycles() {
  return this.http.get<string[]>(
    `${this.baseUrl}/admin/screening/cycles`
  );
}

getPosts(cycle: string) {
  return this.http.get<string[]>(
    `${this.baseUrl}/admin/screening/posts?cycle=${cycle}`
  );
}

 getUsersByRole(role: string) {
    return this.http.get<any[]>(
      `${this.baseUrl}/admin/users/by-role?role=${role}`
    );
  }

assignJobs(payload: any) {
   return this.http.post<AssignJobResponse>(
      `${this.baseUrl}/admin/screening/assign-jobs`,
      payload
    );
  }

  getJobSummary(cycle?: string, post?: string) {
      let url = `${this.baseUrl}/admin/screening/screening-jobs/summary`;

      const params: string[] = [];
      if (cycle) params.push(`cycle=${cycle}`);
      if (post) params.push(`post_name=${post}`);

      if (params.length) {
        url += '?' + params.join('&');
      }

      return this.http.get<any>(url);
  }


    getAssignedJobs() {
    return this.http.get<any[]>(
      `${this.baseUrl}/admin/screening/assigned-jobs`
    );
  }

  resetJob(jobId: number) {
    return this.http.post(
      `${this.baseUrl}/admin/screening/assigned-jobs/${jobId}/reset`,
      {}
    );
  }


buildJobs(cycle: string) {
  return this.http.post<BuildJobResponse>(
    `${this.baseUrl}/admin/screening/build-screening-jobs`,
    { cycle }
  );
}

createTechnicalCommittee(data: any) {
  return this.http.post(
    `${this.baseUrl}/admin/technical-committee`,
    data
  );
}

getCommittees() {
  return this.http.get<any[]>(
    `${this.baseUrl}/admin/technical-committee`
  );
}

updateCommittee(id: number, data: any) {
  return this.http.put(
    `${this.baseUrl}/admin/technical-committee/${id}`,
    data
  );
}

deleteCommittee(id: number) {
  return this.http.delete(
    `${this.baseUrl}/admin/technical-committee/${id}`
  );
}

}