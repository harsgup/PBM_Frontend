import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {env} from '../config/environment'

@Injectable({
  providedIn: 'root'
})
export class ShortlistService {
  private baseUrl = env.apiUrl;


  constructor(private http: HttpClient) { }


  shortlistCandidates(data: any) {
    return this.http.post(
      `${this.baseUrl}/shortlisting/shortlist`,
      data
    );
  }

  getShortlistingJobs(cycle: string, post: string) {
    const payload = { cycle, post_name: post };
    return this.http.post<any[]>(
      `${this.baseUrl}/shortlisting/shortlisting-jobs`,
      payload
    );
  }
}
