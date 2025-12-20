import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { BulkUserWord, UserWord } from '../store/words/model';

@Injectable({
  providedIn: 'root'
})
export class WordListService {

  constructor(private http: HttpClient) { }

  private jsonUrl = 'mockdata/wordlist.json'; // Updated path

  submitUserAddedWord(user: UserWord): Observable<UserWord> {
    // const apiUrl = 'http://localhost:8080/api/words';
    // const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/words';
    const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/words';
    return this.http.post<UserWord>(apiUrl, user);
  }

  fetchData(): Observable<any[]> {
    return this.http.get<any[]>(this.jsonUrl);
  }

  fetchWords() {
    // const apiUrl = 'http://localhost:8080/api/words';
    // const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/words';
    const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/words';
    return this.http.get<UserWord[]>(apiUrl);
  }

  fetchWordsByMobile(mobile: string) {
    // const apiUrl = `http://localhost:8080/api/words/user/${mobile}`;
    // const apiUrl = `https://dictionary-app-backend-9wm9.onrender.com/api/words/user/${mobile}`;
    const apiUrl = `https://dictionaryappbackend-production.up.railway.app/api/words/user/${mobile}`;
    return this.http.get<UserWord[]>(apiUrl);
  }

  fetchWordById(id: number) {
    // const apiUrl = 'http://localhost:8080/api/words/'+ id;
    // const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/words/' + id;
    const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/words/' + id;
    return this.http.get<UserWord>(apiUrl);
  }

  updateWordById(word: any) {
    // const apiUrl = 'http://localhost:8080/api/words/'+ word.id;
    // const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/words/' + word.id;
    const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/words/' + word.id;
    return this.http.put<UserWord>(apiUrl, word);
  }

  deleteWordById(id: number) {
    //  const apiUrl = 'http://localhost:8080/api/words/'+ id;
    // const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/words/' + id;
    const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/words/' + id;
    return this.http.delete<UserWord>(apiUrl);
  }

  bulkSubmitUserWords(user: BulkUserWord): Observable<BulkUserWord> {
    // const apiUrl = 'http://localhost:8080/api/words/bulkInsert';
    // const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/words/bulkInsert';
    const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/words/bulkInsert';
    return this.http.post<BulkUserWord>(apiUrl, user);
  }

  getWordCount(): Observable<any> {
    // const apiUrl = `http://localhost:8080/api/words/totalWordCount`;
    // const apiUrl = `https://dictionary-app-backend-9wm9.onrender.com/api/words/totalWordCount`;
    const apiUrl = `https://dictionaryappbackend-production.up.railway.app/api/words/totalWordCount`;
    return this.http.get(apiUrl);
  }

  getWordCountByMobile(mobile: string): Observable<any> {
    // const apiUrl = `http://localhost:8080/api/words/user/count/${mobile}`;
    // const apiUrl = `https://dictionary-app-backend-9wm9.onrender.com/api/words/user/count/${mobile}`;
    const apiUrl = `https://dictionaryappbackend-production.up.railway.app/api/words/user/count/${mobile}`;
    return this.http.get(apiUrl);
  }
}
