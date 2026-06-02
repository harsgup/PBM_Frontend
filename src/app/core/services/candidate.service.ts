import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { env } from "../../config/environment";
import { Observable } from "rxjs";
import { Cycle, Post } from "../models/candidate-details.model";
import { CandidateDetails } from '../models/candidate-details.model';

@Injectable({
    providedIn: 'root'
})

export class CandidateDetailService {

    private baseUrl = env.apiUrl;

    constructor(private http: HttpClient) { }

    getCycles(): Observable<Cycle[]> {
        return this.http
            .get<Cycle[]>(
                `${this.baseUrl}/metadata/cycles`
            );
    }
    getPost(): Observable<Post[]> {
        return this.http.
            get<Post[]>(
                `${this.baseUrl}/metadata/post_names`
            );
    }

    getCandidates(cycle: string, postName: string, userId: number): Observable<any[]> {
        const params = new HttpParams().set('cycle', cycle).set('post_name', postName).set('user_id', userId);
        return this.http.get<any[]>(`${this.baseUrl}/candidates`, { params });

    }


    getCandidateDetails(applicationNo: string): Observable<CandidateDetails> {
        const params = new HttpParams().set('application_no', applicationNo);
        return this.http.get<CandidateDetails>(
            `${this.baseUrl}/candidates/candidate_details`,
            { params }
        );
    }

    submitReview(applicationNo: string, status: string, remarks: string): Observable<any> {
        return this.http.post<any>(
            `${this.baseUrl}/candidates/submit_review`,
            { application_no: applicationNo, status, remarks }
        );
    }

    getSummaryReport(cycle: string, postName: string): Observable<any> {
        const params = new HttpParams().set('cycle', cycle).set('post_name', postName);
        return this.http.get<any>(`${this.baseUrl}/admin/reports/summary`, { params });
     }

    getAdministrativeScreeningReport(cycle: string, postName: string): Observable<any> {
        const params = new HttpParams().set('cycle', cycle).set('post_name', postName);
        return this.http.get<any>(`${this.baseUrl}/candidates/reports/administrative-screening`, { params });
    }
}

