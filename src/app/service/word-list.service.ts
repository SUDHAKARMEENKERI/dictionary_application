import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { UserWord } from '../store/words/model';

@Injectable({
  providedIn: 'root'
})
export class WordListService {

  constructor(private http: HttpClient) { }
  words: any = [];

  private jsonUrl = 'mockdata/wordlist.json'; // Updated path

  submitUserAddedWord(user: UserWord): Observable<UserWord> {
    // const apiUrl = 'http://localhost:8080/api/words';
    const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/words';
    return this.http.post<UserWord>(apiUrl, user);
  }

  fetchData(): Observable<any[]> {
    return this.http.get<any[]>(this.jsonUrl);
  }

  fetchWords() {
    // const apiUrl = 'http://localhost:8080/api/words';
    const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/words';
    return this.http.get<UserWord>(apiUrl);
  }

  fetchWordById(id: number) {
    // const apiUrl = 'http://localhost:8080/api/words/'+ id;
    const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/words'+ id;
    return this.http.get<UserWord>(apiUrl);
  }

  updateWordById(word: any) {
    // const apiUrl = 'http://localhost:8080/api/words/'+ word.id;
    const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/words'+ word.id;
    return this.http.put<UserWord>(apiUrl, word);
  }

  deleteWordById(id: number) {
    //  const apiUrl = 'http://localhost:8080/api/words/'+ id;
     const apiUrl = 'https://dictionaryappbackend-production.up.railway.app/api/words'+ id;
    return this.http.delete<UserWord>(apiUrl);
  }




}
