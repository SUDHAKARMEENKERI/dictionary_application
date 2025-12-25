import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ContactService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    saveContactForm(formData: any) {
        const url = `${this.apiUrl}/contact`;
        return this.http.post(url, formData);
    }
}