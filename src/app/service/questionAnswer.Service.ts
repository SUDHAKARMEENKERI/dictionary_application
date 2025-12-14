import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { BulkUserWord, UserWord } from '../store/words/model';

@Injectable({
    providedIn: 'root'
})
export class QuestionAnswerService {

    constructor(private http: HttpClient) { }

    createUserQA(userQA: any): Observable<any> {
        // const apiUrl = 'http://localhost:8080/api/qa/create';
        const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/qa/create';
        return this.http.post<any>(apiUrl, userQA);
    }

    getAllUserQA(): Observable<any> {
        // const apiUrl = 'http://localhost:8080/api/qa/getAllUserQA';
        const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/qa/getAllUserQA';
        return this.http.get<any>(apiUrl);
    }

}
