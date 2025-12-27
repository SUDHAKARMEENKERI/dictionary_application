import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { DropdownResponse, Technology } from '../models/Technology';

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

    getAllTechCategories(){
        const url = `${this.apiUrl}/getTechCategories`;
        return this.http.get<DropdownResponse[]>(url);
    }

    getAllTechItems(categoryId: number){
        const url = `${this.apiUrl}/getTechItems?category_id=${categoryId}`;
        return this.http.get<DropdownResponse[]>(url);
    }
}