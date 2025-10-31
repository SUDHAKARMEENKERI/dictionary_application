import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WordListService {

  constructor(private http: HttpClient) { }
  words: any = [];

  private jsonUrl = 'mockdata/wordlist.json'; // Updated path


  fetchData(): Observable<any[]> {
    // return this.http.get<any[]>(this.jsonUrl);
    return of([
      { "departmentId": 1, "departmentName": "HR" },
      { "departmentId": 2, "departmentName": "Finance" },
      { "departmentId": 3, "departmentName": "IT" }
    ]);
  }


}
