import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { BulkUserWord, UserWord } from '../store/words/model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WordListService {

  constructor(private http: HttpClient) { }

  private jsonUrl = 'mockdata/wordlist.json'; // Updated path
  private apiUrl = environment.apiUrl;

  submitUserAddedWord(user: UserWord): Observable<UserWord> {
    const url = `${this.apiUrl}/words`;
    return this.http.post<UserWord>(url, user);
  }

  fetchData(): Observable<any[]> {
    return this.http.get<any[]>(this.jsonUrl);
  }

  fetchWords() {
    const url = `${this.apiUrl}/words`;
    return this.http.get<UserWord[]>(url);
  }

  fetchWordsByMobile(mobile: string) {
    const url = `${this.apiUrl}/words/user/${mobile}`;
    return this.http.get<UserWord[]>(url);
  }

  fetchWordById(id: number) {
    const url = `${this.apiUrl}/words/${id}`;
    return this.http.get<UserWord>(url);
  }

  updateWordById(word: any) {
    const url = `${this.apiUrl}/words/${word.id}`;
    return this.http.put<UserWord>(url, word);
  }

  deleteWordById(id: number) {
    const url = `${this.apiUrl}/words/${id}`;
    return this.http.delete<UserWord>(url);
  }

  bulkSubmitUserWords(user: BulkUserWord): Observable<BulkUserWord> {
    const url = `${this.apiUrl}/words/bulkInsert`;
    return this.http.post<BulkUserWord>(url, user);
  }

  getWordCount(): Observable<any> {
    const url = `${this.apiUrl}/words/totalWordCount`;
    return this.http.get(url);
  }

  getWordCountByMobile(mobile: string): Observable<any> {
    const url = `${this.apiUrl}/words/user/count/${mobile}`;
    return this.http.get(url);
  }
}
