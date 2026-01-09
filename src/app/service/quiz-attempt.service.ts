import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type QuizAttempt = {
  id?: string;
  createdAt?: string;
  topic?: string;
  planTitle?: string;
  total: number;
  correct: number;
  wrong: number;
  unattempted: number;
  percent: number;
  showResult: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class QuizAttemptService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Save a new quiz attempt to the backend
   */
  saveAttempt(attempt: QuizAttempt): Observable<QuizAttempt> {
    const url = `${this.apiUrl}/quiz-attempts`;
    return this.http.post<QuizAttempt>(url, attempt);
  }

  /**
   * Get all quiz attempts for the current user where showResult is true
   */
  getAttempts(params?: { limit?: number }): Observable<QuizAttempt[]> {
    const url = `${this.apiUrl}/quiz-attempts`;
    
    let httpParams = new HttpParams();
    httpParams = httpParams.set('showResult', 'true');
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<QuizAttempt[]>(url, {
      params: httpParams
    });
  }

  /**
   * Hide all quiz attempts for the current user by setting showResult to false
   */
  clearAttempts(): Observable<void> {
    const url = `${this.apiUrl}/quiz-attempts/hide-all`;
    return this.http.put<void>(url, {});
  }
}
