import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface TechnologyAnswer {
  technology: string;
  answer: string;
}

export interface ProgrammingQuestion {
  id?: number | string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  prompt: string;
  answer?: string; // Deprecated: kept for backward compatibility
  answers?: TechnologyAnswer[]; // New: multiple answers by technology
  hints?: string;
  mobile?: string; // User's mobile who created the question
  isAdmin?: boolean; // Whether the question is approved/verified by admin
  createdAt?: Date | string;
  updatedAt?: Date | string;
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

  getQuestionById(id: string | number): Observable<ProgrammingQuestion> {
    const url = `${this.apiUrl}/programming-questions/${id}`;
    return this.http.get<ProgrammingQuestion>(url);
  }

  createQuestion(question: ProgrammingQuestion): Observable<ProgrammingQuestion> {
    const url = `${this.apiUrl}/programming-questions`;
    return this.http.post<ProgrammingQuestion>(url, question);
  }

  updateQuestion(id: string | number, question: ProgrammingQuestion): Observable<ProgrammingQuestion> {
    const url = `${this.apiUrl}/programming-questions/${id}`;
    return this.http.put<ProgrammingQuestion>(url, question);
  }

  deleteQuestion(id: string | number): Observable<any> {
    const url = `${this.apiUrl}/programming-questions/${id}`;
    return this.http.delete<any>(url);
  }
}
