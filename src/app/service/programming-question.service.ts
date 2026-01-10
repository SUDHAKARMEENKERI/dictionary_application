import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface ProgrammingQuestion {
  id?: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  prompt: string;
  answer?: string;
  hints?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProgrammingQuestionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllQuestions(): Observable<ProgrammingQuestion[]> {
    const url = `${this.apiUrl}/programming-questions`;
    return this.http.get<ProgrammingQuestion[]>(url);
  }

  getQuestionById(id: string): Observable<ProgrammingQuestion> {
    const url = `${this.apiUrl}/programming-questions/${id}`;
    return this.http.get<ProgrammingQuestion>(url);
  }

  createQuestion(question: ProgrammingQuestion): Observable<ProgrammingQuestion> {
    const url = `${this.apiUrl}/programming-questions`;
    return this.http.post<ProgrammingQuestion>(url, question);
  }

  updateQuestion(id: string, question: ProgrammingQuestion): Observable<ProgrammingQuestion> {
    const url = `${this.apiUrl}/programming-questions/${id}`;
    return this.http.put<ProgrammingQuestion>(url, question);
  }

  deleteQuestion(id: string): Observable<any> {
    const url = `${this.apiUrl}/programming-questions/${id}`;
    return this.http.delete<any>(url);
  }
}
