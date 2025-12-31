import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})

export class MCQQuestionService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getAllMcq(params?: { topic?: string; category?: string; technology?: string; questionType?: string }) {
        const url = `${this.apiUrl}/mcqQuestions/getMcq`;

        let httpParams = new HttpParams();
        const topic = (params?.topic ?? '').toString().trim();
        const category = (params?.category ?? '').toString().trim();
        const technology = (params?.technology ?? '').toString().trim();
        const questionType = (params?.questionType ?? '').toString().trim();

        if (topic) httpParams = httpParams.set('topic', topic);
        if (category) httpParams = httpParams.set('category', category);
        if (technology) httpParams = httpParams.set('technology', technology);
        if (questionType) httpParams = httpParams.set('questionType', questionType.trim());

        return this.http.get<any>(url, {
            params: httpParams.keys().length ? httpParams : undefined,
        });
    }
}