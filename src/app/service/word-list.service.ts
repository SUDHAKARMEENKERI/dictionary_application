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
    // Step 1: Get existing data
    const existingData = localStorage.getItem('userAddedData');
    const dataArray = existingData ? JSON.parse(existingData) : [];
    const newWord = { ...user, id: dataArray.length + 1 };
    // Step 2: Add new entry
    dataArray.push(newWord);

    // Step 3: Save updated array
    localStorage.setItem('userAddedData', JSON.stringify(dataArray));


    return this.http.post<UserWord>('/api/users', user);
  }

  fetchData(): Observable<any[]> {
    return this.http.get<any[]>(this.jsonUrl);
  }

  fetchWords() {
    const existingData = localStorage.getItem('userAddedData');
    const dataArray = existingData ? JSON.parse(existingData) : [];
    return of(dataArray);
  }

  fetchWordById(id: number) {
    const existingData = localStorage.getItem('userAddedData');
    const dataArray = existingData ? JSON.parse(existingData) : [];
    const data = dataArray.find((item: UserWord) => item.id === id);
    return of(data);
  }

  deleteWordById(id: number) {
    const existingData = localStorage.getItem('userAddedData');
    const dataArray = existingData ? JSON.parse(existingData) : [];
    const data = dataArray.filter((item: UserWord) => item.id !== id);
    return of(data);
  }




}
