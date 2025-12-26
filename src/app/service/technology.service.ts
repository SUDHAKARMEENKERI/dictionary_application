import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Technology } from '../models/Technology';

@Injectable({
    providedIn: 'root'
})
export class TechnologyService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }
 
    getAllTechnologies(): Observable<Technology[]> {
        const url = `${this.apiUrl}/technologies`;
        return this.http.get<Technology[]>(url);
    }
}