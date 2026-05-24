import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {env} from '../config/environment'
import { TechnicalJob } from '../layout/technical/technical-screening/technical-screening.component';
@Injectable({
  providedIn: 'root'
})
export class TechnicalService {
  private baseUrl = env.apiUrl;
  constructor(private http: HttpClient) { }


getCandidateDetails(application_no: string) {
  return this.http.get<any>(
    `${this.baseUrl}/technical/technical-evaluation/${application_no}`
  );
}

getTechnicalScreeningJobs(cycle: string, post: string) {
  const payload = { 
    cycle: cycle, 
    post_name: post 
  };
 return this.http.post<TechnicalJob[]>(`${this.baseUrl}/technical/technical-screening-job`,payload);
}

getCommitteeDetails(name: string) {
  return this.http.get<any>(`${this.baseUrl}/technical/committee-details/${name}`);
}

getTechnicalEvaluation(applicationNo: string) {
  return this.http.get<any>(
    `${this.baseUrl}/technical/technical-screening/${applicationNo}`
  );
}

submitTechnicalEvaluation(data: any) {
  return this.http.post(
    `${this.baseUrl}/technical/technical-screening`,
    data
  );
}


getDocument(data: any) {
  return this.http.post<any>(`${this.baseUrl}/file/document`,data);
}

}
