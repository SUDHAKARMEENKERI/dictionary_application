import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class QuestionAnswerService {

    constructor(private http: HttpClient) { }

    createUserQA(userQA: any): Observable<any> {
        // const apiUrl = 'http://localhost:8080/api/qa/create';
        // const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/qa/create'; 
        // const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/qa/create'; 
        const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/qa/create';
        return this.http.post<any>(apiUrl, userQA);
    }

    upateUserQA(id: string, userQA: any): Observable<any> {
        // const apiUrl = `http://localhost:8080/api/qa/update/${id}`;
        // const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/qa/update'; 
        const apiUrl = `https://dictionaryappbackend-production.up.railway.app/api/qa/update/${id}`;
        return this.http.put<any>(apiUrl, userQA);
    }

    getAllUserQA(): Observable<any> {
        // const apiUrl = 'http://localhost:8080/api/qa/getAllUserQA';
        //  const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/qa/getAllUserQA';
        const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/qa/getAllUserQA';
        return this.http.get<any>(apiUrl);
    }

    getAllUserQAById(id: string): Observable<any> {
        // const apiUrl = `http://localhost:8080/api/qa/${id}`;
        //  const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/qa/${id}';
        const apiUrl = `https://dictionaryappbackend-production.up.railway.app/api/qa/${id}`;
        return this.http.get<any>(apiUrl);
    }

    getQuestionAnswerCountByMobile(mobile: string): Observable<number> {
        //  const apiUrl = `http://localhost:8080/api/qa/user/count/${mobile}`;
        const apiUrl = `https://dictionaryappbackend-production.up.railway.app/api/qa/user/count/${mobile}`;
        return this.http.get<number>(apiUrl);
    }

    getQuestionAnswerCount(): Observable<number> {
        // const apiUrl = `http://localhost:8080/api/qa/totalQuestionAnswerCount`;
        const apiUrl = `https://dictionaryappbackend-production.up.railway.app/api/qa/totalQuestionAnswerCount`;
        return this.http.get<{ totalQuestionAnswerCount: number }>(apiUrl).pipe(
            map(response => response.totalQuestionAnswerCount)
        );
    }

    deleteUserQAById(id: string): Observable<any> {
        // const apiUrl = `http://localhost:8080/api/qa/delete/${id}`;
        // const apiUrl = `https://dictionary-app-backend-9wm9.onrender.com/api/qa/delete/${id}`;
        const apiUrl = `https://dictionaryappbackend-production.up.railway.app/api/qa/delete/${id}`;
        return this.http.delete<any>(apiUrl);
    }

    getPagedQuestionAnswers(page: number, size: number): Observable<any> {
        // const apiUrl = `http://localhost:8080/api/qa/list?page=${page}&size=${size}`;
        // const apiUrl = `https://dictionary-app-backend-9wm9.onrender.com/api/qa/list?page=${page}&size=${size}`;
        const apiUrl = `https://dictionaryappbackend-production.up.railway.app/api/qa/list?page=${page}&size=${size}`;
        return this.http.get<any>(apiUrl);
    }

    bulkUploadQA(formData: any): Observable<any> {
        // const apiUrl = `http://localhost:8080/api/qa/bulkUploadQA`;
        const apiUrl = `https://dictionaryappbackend-production.up.railway.app/api/qa/bulkUploadQA`;

        return this.http.post<any>(apiUrl, formData);

    }

}
