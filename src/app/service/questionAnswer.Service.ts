import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { QuestionAnswer } from '../models/Technology';

@Injectable({
    providedIn: 'root'
})
export class QuestionAnswerService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    createUserQA(userQA: any): Observable<any> {
        const url = `${this.apiUrl}/qa/create`;
        return this.http.post<any>(url, userQA);
    }

    upateUserQA(id: string, userQA: any): Observable<any> {
        const url = `${this.apiUrl}/qa/update/${id}`;
        return this.http.put<any>(url, userQA);
    }

    getAllUserQA(): Observable<any> {
        const url = `${this.apiUrl}/qa/getAllUserQA`;
        return this.http.get<any>(url);
    }

    getAllUserQAById(id: string): Observable<any> {
        const url = `${this.apiUrl}/qa/${id}`;
        return this.http.get<any>(url);
    }

    getQuestionAnswerCountByMobile(mobile: string): Observable<number> {
        const url = `${this.apiUrl}/qa/user/count/${mobile}`;
        return this.http.get<number>(url);
    }

    getQuestionAnswerCount(): Observable<number> {
        const url = `${this.apiUrl}/qa/totalQuestionAnswerCount`;
        return this.http.get<{ totalQuestionAnswerCount: number }>(url).pipe(
            map(response => response.totalQuestionAnswerCount)
        );
    }

    deleteUserQAById(id: string): Observable<any> {
        const url = `${this.apiUrl}/qa/delete/${id}`;
        return this.http.delete<any>(url);
    }

    getPagedQuestionAnswers(page: number, size: number, level?: string, searchQuery?: string): Observable<any> {
        const levelParam = level ? `&level=${encodeURIComponent(level)}` : '';
        const q = (searchQuery ?? '').toString().trim();
        const searchParam = q ? `&search=${encodeURIComponent(q)}` : '';
        const url = `${this.apiUrl}/qa/list?page=${page}&size=${size}${levelParam}${searchParam}`;
        return this.http.get<any>(url);
    }

    bulkUploadQA(formData: any): Observable<any> {
        // New endpoint (preferred): /api/qa/bulk-upload
        // Legacy endpoint (fallback): /api/qa/bulkUploadQA
        const newUrl = `${this.apiUrl}/qa/bulk-upload`;
        const legacyUrl = `${this.apiUrl}/qa/bulkUploadQA`;

        return this.http.post<any>(newUrl, formData).pipe(
            catchError((error: any) => {
                // Backward compatibility if backend hasn't been updated yet.
                if (error?.status === 404) {
                    return this.http.post<any>(legacyUrl, formData);
                }
                return throwError(() => error);
            })
        );
    }

    getQAByTopic(topic: string) {
        const url = `${this.apiUrl}/qa?topic=${topic}`;
        return this.http.get<QuestionAnswer[]>(url);
    }

    createMcqQA(reqBody: any){
        const url = `${this.apiUrl}/mcqQuestions/mcq`;
        return this.http.post<any>(url, reqBody);
    }

    getAllMcqQA(){
        const url = `${this.apiUrl}/mcqQuestions/getMcq`;
        return this.http.get<any>(url)
    }


}
